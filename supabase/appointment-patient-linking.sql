-- =====================================================
-- 🔗 APPOINTMENT-PATIENT LINKING SYSTEM
-- =====================================================
-- 
-- This migration creates a comprehensive system to:
-- 1. Link appointments with patients
-- 2. Handle multiple phone numbers per patient
-- 3. Migrate existing appointments to link with patients
-- 4. Create smart patient matching logic
-- 
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: ADD PATIENT_ID TO APPOINTMENTS TABLE
-- =====================================================

-- Add patient_id column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);

-- =====================================================
-- STEP 2: CREATE PATIENT PHONES TABLE FOR MULTIPLE PHONES
-- =====================================================

-- Create patient_phones table to handle multiple phone numbers
CREATE TABLE IF NOT EXISTS patient_phones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    phone_type VARCHAR(20) DEFAULT 'primary' CHECK (phone_type IN ('primary', 'secondary', 'emergency', 'family')),
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique phone per patient
    UNIQUE(patient_id, phone)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_phones_patient_id ON patient_phones(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_phones_phone ON patient_phones(phone);
CREATE INDEX IF NOT EXISTS idx_patient_phones_primary ON patient_phones(is_primary);

-- Create trigger for updated_at
CREATE TRIGGER update_patient_phones_updated_at 
    BEFORE UPDATE ON patient_phones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE patient_phones ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on patient_phones" ON patient_phones
    FOR ALL USING (true);

-- =====================================================
-- STEP 3: MIGRATE EXISTING PATIENT PHONES
-- =====================================================

-- Migrate existing patient phones to patient_phones table
INSERT INTO patient_phones (patient_id, phone, phone_type, is_primary, is_verified)
SELECT 
    id as patient_id,
    phone,
    'primary' as phone_type,
    TRUE as is_primary,
    TRUE as is_verified
FROM patients 
WHERE phone IS NOT NULL AND phone != ''
ON CONFLICT (patient_id, phone) DO NOTHING;

-- =====================================================
-- STEP 4: SMART PATIENT MATCHING FUNCTION
-- =====================================================

-- Function to find or create patient based on appointment data
CREATE OR REPLACE FUNCTION find_or_create_patient(
    p_full_name VARCHAR(255),
    p_phone VARCHAR(20),
    p_email VARCHAR(255),
    p_clinic_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_patient_id UUID;
    v_first_name VARCHAR(255);
    v_last_name VARCHAR(255);
    v_existing_patient_id UUID;
    v_existing_full_name VARCHAR(255);
    v_name_match BOOLEAN;
    v_cleaned_name VARCHAR(255);
    v_name_parts TEXT[];
    v_part_count INTEGER;
BEGIN
    -- Clean and normalize the full name
    v_cleaned_name := trim(regexp_replace(p_full_name, '\s+', ' ', 'g'));
    
    -- Split the cleaned name into parts
    v_name_parts := string_to_array(v_cleaned_name, ' ');
    v_part_count := array_length(v_name_parts, 1);
    
    -- Robust name splitting logic
    IF v_part_count = 0 OR v_cleaned_name = '' THEN
        -- Empty or invalid name
        v_first_name := '';
        v_last_name := NULL;
    ELSIF v_part_count = 1 THEN
        -- Single name only
        v_first_name := v_name_parts[1];
        v_last_name := NULL;
    ELSIF v_part_count = 2 THEN
        -- Two names: first and last
        v_first_name := v_name_parts[1];
        v_last_name := v_name_parts[2];
    ELSIF v_part_count = 3 THEN
        -- Three names: handle common patterns
        -- Check if first part is a title (Dr., Mr., Mrs., etc.)
        IF v_name_parts[1] IN ('Dr.', 'Dr', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Prof.', 'Prof') THEN
            v_first_name := v_name_parts[2];
            v_last_name := v_name_parts[3];
        ELSE
            -- Regular three-part name: first, middle, last
            v_first_name := v_name_parts[1];
            v_last_name := v_name_parts[2] || ' ' || v_name_parts[3];
        END IF;
    ELSE
        -- Four or more names: first name + rest as last name
        v_first_name := v_name_parts[1];
        v_last_name := array_to_string(v_name_parts[2:], ' ');
    END IF;
    
    -- Clean up the names (remove extra spaces, normalize case)
    v_first_name := trim(v_first_name);
    v_last_name := CASE WHEN v_last_name IS NOT NULL THEN trim(v_last_name) ELSE NULL END;
    
    -- Check if patient exists by phone
    SELECT pp.patient_id INTO v_existing_patient_id
    FROM patient_phones pp
    WHERE pp.phone = p_phone
    AND pp.patient_id IN (
        SELECT id FROM patients WHERE clinic_id = p_clinic_id
    )
    LIMIT 1;
    
    IF v_existing_patient_id IS NOT NULL THEN
        -- Patient exists with this phone - check name match
        SELECT 
            CONCAT(first_name, ' ', COALESCE(last_name, '')) INTO v_existing_full_name
        FROM patients 
        WHERE id = v_existing_patient_id;
        
        -- Robust name comparison (case-insensitive, normalized)
        v_name_match := LOWER(TRIM(regexp_replace(v_existing_full_name, '\s+', ' ', 'g'))) = 
                       LOWER(TRIM(regexp_replace(p_full_name, '\s+', ' ', 'g')));
        
        IF v_name_match THEN
            -- Same person - return existing patient ID
            RETURN v_existing_patient_id;
        ELSE
            -- Different person with same phone - create new patient
            INSERT INTO patients (
                clinic_id, 
                first_name, 
                last_name, 
                phone, 
                email,
                is_active
            ) VALUES (
                p_clinic_id,
                v_first_name,
                v_last_name,
                p_phone,
                p_email,
                TRUE
            ) RETURNING id INTO v_patient_id;
            
            -- Add phone to patient_phones table
            INSERT INTO patient_phones (patient_id, phone, phone_type, is_primary, is_verified)
            VALUES (v_patient_id, p_phone, 'primary', TRUE, TRUE);
            
            RETURN v_patient_id;
        END IF;
    ELSE
        -- New patient - create record
        INSERT INTO patients (
            clinic_id, 
            first_name, 
            last_name, 
            phone, 
            email,
            is_active
        ) VALUES (
            p_clinic_id,
            v_first_name,
            v_last_name,
            p_phone,
            p_email,
            TRUE
        ) RETURNING id INTO v_patient_id;
        
        -- Add phone to patient_phones table
        INSERT INTO patient_phones (patient_id, phone, phone_type, is_primary, is_verified)
        VALUES (v_patient_id, p_phone, 'primary', TRUE, TRUE);
        
        RETURN v_patient_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: MIGRATE EXISTING APPOINTMENTS
-- =====================================================

-- Function to migrate existing appointments
CREATE OR REPLACE FUNCTION migrate_appointments_to_patients()
RETURNS void AS $$
DECLARE
    appointment_record RECORD;
    v_patient_id UUID;
    migrated_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting appointment migration...';
    
    FOR appointment_record IN 
        SELECT a.id, a.clinic_id, a.name, a.phone, a.email
        FROM appointments a
        WHERE a.patient_id IS NULL
    LOOP
        BEGIN
            -- Find or create patient for this appointment
            v_patient_id := find_or_create_patient(
                appointment_record.name,
                appointment_record.phone,
                appointment_record.email,
                appointment_record.clinic_id
            );
            
            -- Update appointment with patient_id
            UPDATE appointments 
            SET patient_id = v_patient_id
            WHERE id = appointment_record.id;
            
            migrated_count := migrated_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error migrating appointment %: %', appointment_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Migrated: %, Errors: %', migrated_count, error_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: APPOINTMENT BOOKING TRIGGER
-- =====================================================

-- Function to automatically link appointments with patients
CREATE OR REPLACE FUNCTION auto_link_appointment_with_patient()
RETURNS TRIGGER AS $$
DECLARE
    patient_id UUID;
BEGIN
    -- Only process if patient_id is not already set
    IF NEW.patient_id IS NULL THEN
        -- Find or create patient
        patient_id := find_or_create_patient(
            NEW.name,
            NEW.phone,
            NEW.email,
            NEW.clinic_id
        );
        
        -- Set the patient_id
        NEW.patient_id := patient_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new appointments
DROP TRIGGER IF EXISTS auto_link_appointment_trigger ON appointments;
CREATE TRIGGER auto_link_appointment_trigger
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION auto_link_appointment_with_patient();

-- =====================================================
-- STEP 7: UTILITY FUNCTIONS
-- =====================================================

-- Function to get patient by phone (handles multiple phones)
CREATE OR REPLACE FUNCTION get_patient_by_phone(p_phone VARCHAR(20), p_clinic_id UUID)
RETURNS TABLE(
    patient_id UUID,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as patient_id,
        p.first_name,
        p.last_name,
        (p.first_name || ' ' || COALESCE(p.last_name, ''))::VARCHAR(255) as full_name,
        p.email,
        COUNT(pp.phone) as phone_count
    FROM patients p
    LEFT JOIN patient_phones pp ON p.id = pp.patient_id
    WHERE p.clinic_id = p_clinic_id
    AND EXISTS (
        SELECT 1 FROM patient_phones pp2 
        WHERE pp2.patient_id = p.id 
        AND pp2.phone = p_phone
    )
    GROUP BY p.id, p.first_name, p.last_name, p.email;
END;
$$ LANGUAGE plpgsql;

-- Function to get all phones for a patient
CREATE OR REPLACE FUNCTION get_patient_phones(p_patient_id UUID)
RETURNS TABLE(
    phone VARCHAR(20),
    phone_type VARCHAR(20),
    is_primary BOOLEAN,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.phone,
        pp.phone_type,
        pp.is_primary,
        pp.is_verified
    FROM patient_phones pp
    WHERE pp.patient_id = p_patient_id
    ORDER BY pp.is_primary DESC, pp.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 8: RUN MIGRATION
-- =====================================================

-- Run the migration (uncomment to execute)
-- SELECT migrate_appointments_to_patients();

-- =====================================================
-- ✅ VERIFICATION QUERIES
-- =====================================================

-- Check migration results
SELECT 
    COUNT(*) as total_appointments,
    COUNT(patient_id) as linked_appointments,
    COUNT(*) - COUNT(patient_id) as unlinked_appointments
FROM appointments;

-- Check patient phones
SELECT 
    p.first_name,
    p.last_name,
    COUNT(pp.phone) as phone_count,
    STRING_AGG(pp.phone, ', ') as phones
FROM patients p
LEFT JOIN patient_phones pp ON p.id = pp.patient_id
GROUP BY p.id, p.first_name, p.last_name
HAVING COUNT(pp.phone) > 1
ORDER BY phone_count DESC;

-- Check appointments with patient info
SELECT 
    a.name as appointment_name,
    a.phone as appointment_phone,
    p.first_name,
    p.last_name,
    CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as patient_full_name,
    a.patient_id IS NOT NULL as is_linked
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LIMIT 10;

-- =====================================================
-- 🎯 SYSTEM SUMMARY
-- =====================================================
-- 
-- ✅ Added patient_id to appointments table
-- ✅ Created patient_phones table for multiple phones
-- ✅ Smart patient matching function
-- ✅ Automatic appointment-patient linking
-- ✅ Migration function for existing data
-- ✅ Utility functions for phone management
-- 
-- Next Steps:
-- 1. Run migration: SELECT migrate_appointments_to_patients();
-- 2. Update frontend to use new patient linking
-- 3. Test multiple phone number scenarios
-- 
-- =====================================================

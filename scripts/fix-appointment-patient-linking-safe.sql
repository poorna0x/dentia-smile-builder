-- Fix Appointment-Patient Linking (Safe Version)
-- This script safely adds missing components without conflicts
-- Run this in Supabase SQL editor

-- Step 1: Add patient_id column to appointments table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'patient_id'
    ) THEN
        ALTER TABLE appointments ADD COLUMN patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added patient_id column to appointments table';
    ELSE
        RAISE NOTICE 'patient_id column already exists in appointments table';
    END IF;
END $$;

-- Step 2: Create index for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);

-- Step 3: Create patient_phones table if it doesn't exist
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

-- Step 4: Create indexes for patient_phones (if not exist)
CREATE INDEX IF NOT EXISTS idx_patient_phones_patient_id ON patient_phones(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_phones_phone ON patient_phones(phone);
CREATE INDEX IF NOT EXISTS idx_patient_phones_primary ON patient_phones(is_primary);

-- Step 5: Create trigger for updated_at (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_patient_phones_updated_at'
    ) THEN
        CREATE TRIGGER update_patient_phones_updated_at 
            BEFORE UPDATE ON patient_phones 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_patient_phones_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_patient_phones_updated_at trigger already exists';
    END IF;
END $$;

-- Step 6: Enable RLS for patient_phones (if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'patient_phones' AND rowsecurity = true
    ) THEN
        ALTER TABLE patient_phones ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS for patient_phones table';
    ELSE
        RAISE NOTICE 'RLS already enabled for patient_phones table';
    END IF;
END $$;

-- Step 7: Create policies for patient_phones (if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patient_phones' AND policyname = 'Allow all operations on patient_phones'
    ) THEN
        CREATE POLICY "Allow all operations on patient_phones" ON patient_phones
            FOR ALL USING (true);
        RAISE NOTICE 'Created policy for patient_phones table';
    ELSE
        RAISE NOTICE 'Policy for patient_phones table already exists';
    END IF;
END $$;

-- Step 8: Migrate existing patient phones to patient_phones table (safe insert)
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

-- Step 9: Create the find_or_create_patient function (replace if exists)
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

-- Step 10: Create the auto_link_appointment_with_patient function (replace if exists)
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

-- Step 11: Create trigger for new appointments (drop and recreate to ensure it's correct)
DROP TRIGGER IF EXISTS auto_link_appointment_trigger ON appointments;
CREATE TRIGGER auto_link_appointment_trigger
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION auto_link_appointment_with_patient();

-- Step 12: Verify the setup
SELECT '✅ Appointment-Patient Linking Setup Complete' as status;

-- Step 13: Show verification queries
SELECT 'Verification queries:' as info;
SELECT '1. Check if patient_id column exists:' as query;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'patient_id';

SELECT '2. Check if trigger exists:' as query;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'auto_link_appointment_trigger';

SELECT '3. Check if function exists:' as query;
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name = 'find_or_create_patient';

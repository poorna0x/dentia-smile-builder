-- =====================================================
-- 🔧 COMPREHENSIVE FUNCTION FIX
-- =====================================================
-- 
-- This fixes all data type issues in the database functions
-- Run this in Supabase SQL Editor
-- =====================================================

-- Fix 1: Update get_patient_by_phone function
DROP FUNCTION IF EXISTS get_patient_by_phone(VARCHAR(20), UUID);

CREATE OR REPLACE FUNCTION get_patient_by_phone(p_phone VARCHAR(20), p_clinic_id UUID)
RETURNS TABLE(
    patient_id UUID,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone_count BIGINT
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

-- Fix 2: Update get_patient_phones function
DROP FUNCTION IF EXISTS get_patient_phones(UUID);

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

-- Fix 3: Update find_or_create_patient function (if needed)
-- This function should already be correct, but let's verify
DROP FUNCTION IF EXISTS find_or_create_patient(VARCHAR(255), VARCHAR(20), VARCHAR(255), UUID);

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
            (first_name || ' ' || COALESCE(last_name, ''))::VARCHAR(255) INTO v_existing_full_name
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
-- ✅ TEST ALL FUNCTIONS
-- =====================================================
-- 
-- After running this fix, test with:
-- 
-- 1. Test get_patient_by_phone:
-- SELECT * FROM get_patient_by_phone('8105876772', 'c1ca557d-ca85-4905-beb7-c3985692d463');
-- 
-- 2. Test get_patient_phones (replace with actual patient ID):
-- SELECT * FROM get_patient_phones('your-patient-id-here');
-- 
-- 3. Test find_or_create_patient:
-- SELECT find_or_create_patient('Test Patient', '1234567890', 'test@example.com', 'c1ca557d-ca85-4905-beb7-c3985692d463');
-- 
-- =====================================================

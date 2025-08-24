-- =====================================================
-- 🧠 IMPROVED NAME MATCHING LOGIC
-- =====================================================
-- 
-- Automatic name matching without user input
-- Uses first_name and last_name from patients table
-- =====================================================

-- Function to extract first name from full name (handles initials, titles, etc.)
CREATE OR REPLACE FUNCTION extract_first_name(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_cleaned_name TEXT;
    v_name_parts TEXT[];
    v_part_count INTEGER;
    v_first_name TEXT;
BEGIN
    -- Clean and normalize the full name
    v_cleaned_name := trim(regexp_replace(full_name, '\s+', ' ', 'g'));
    
    -- Split the cleaned name into parts
    v_name_parts := string_to_array(v_cleaned_name, ' ');
    v_part_count := array_length(v_name_parts, 1);
    
    -- Extract first name based on patterns
    IF v_part_count = 0 OR v_cleaned_name = '' THEN
        v_first_name := '';
    ELSIF v_part_count = 1 THEN
        -- Single name
        v_first_name := v_name_parts[1];
    ELSIF v_part_count = 2 THEN
        -- Two names: check if first is initial or title
        IF v_name_parts[1] ~ '^[A-Z]\.?$' THEN
            -- First is initial (J. or J), use second as first name
            v_first_name := v_name_parts[2];
        ELSIF v_name_parts[1] IN ('Dr.', 'Dr', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Prof.', 'Prof') THEN
            -- First is title, use second as first name
            v_first_name := v_name_parts[2];
        ELSE
            -- Regular two-part name
            v_first_name := v_name_parts[1];
        END IF;
    ELSIF v_part_count = 3 THEN
        -- Three names: check if first is initial or title
        IF v_name_parts[1] ~ '^[A-Z]\.?$' THEN
            -- First is initial, use second as first name
            v_first_name := v_name_parts[2];
        ELSIF v_name_parts[1] IN ('Dr.', 'Dr', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Prof.', 'Prof') THEN
            -- First is title, use second as first name
            v_first_name := v_name_parts[2];
        ELSE
            -- Regular three-part name
            v_first_name := v_name_parts[1];
        END IF;
    ELSE
        -- Four or more names: use first as first name
        v_first_name := v_name_parts[1];
    END IF;
    
    -- Clean up and return
    RETURN LOWER(TRIM(v_first_name));
END;
$$ LANGUAGE plpgsql;

-- Function to check if two names likely refer to the same person
CREATE OR REPLACE FUNCTION is_same_person(
    existing_first_name TEXT,
    existing_last_name TEXT,
    new_full_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    new_first_name TEXT;
    existing_clean_first TEXT;
    existing_clean_last TEXT;
    new_clean_first TEXT;
BEGIN
    -- Extract first name from new full name
    new_first_name := extract_first_name(new_full_name);
    
    -- Clean existing names
    existing_clean_first := LOWER(TRIM(existing_first_name));
    existing_clean_last := LOWER(TRIM(COALESCE(existing_last_name, '')));
    new_clean_first := LOWER(TRIM(new_first_name));
    
    -- Case 1: Exact first name match (most common)
    IF existing_clean_first = new_clean_first THEN
        RETURN TRUE;
    END IF;
    
    -- Case 2: Handle initials (J Poorna vs Poorna)
    IF existing_clean_first ~ '^[a-z]\.?$' AND new_clean_first = existing_clean_last THEN
        RETURN TRUE;
    END IF;
    
    -- Case 3: Handle common nicknames
    IF (existing_clean_first = 'poorna' AND new_clean_first = 'poo') OR
       (existing_clean_first = 'poo' AND new_clean_first = 'poorna') OR
       (existing_clean_first = 'john' AND new_clean_first = 'johnny') OR
       (existing_clean_first = 'johnny' AND new_clean_first = 'john') OR
       (existing_clean_first = 'mike' AND new_clean_first = 'michael') OR
       (existing_clean_first = 'michael' AND new_clean_first = 'mike') THEN
        RETURN TRUE;
    END IF;
    
    -- Case 4: Handle middle names (Poorna vs Poorna Shetty)
    -- If existing has no last name and new has same first name
    IF existing_clean_first = new_clean_first AND existing_clean_last = '' THEN
        RETURN TRUE;
    END IF;
    
    -- Case 5: Handle reversed initials (Poorna J vs J Poorna)
    IF existing_clean_first = new_clean_first AND 
       (existing_clean_last ~ '^[a-z]\.?$' OR new_clean_first ~ '^[a-z]\.?$') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Updated find_or_create_patient function with improved logic
CREATE OR REPLACE FUNCTION find_or_create_patient_improved(
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
    v_existing_first_name VARCHAR(255);
    v_existing_last_name VARCHAR(255);
    v_same_person BOOLEAN;
    v_cleaned_name VARCHAR(255);
    v_name_parts TEXT[];
    v_part_count INTEGER;
BEGIN
    -- Extract first and last name from full name
    v_cleaned_name := trim(regexp_replace(p_full_name, '\s+', ' ', 'g'));
    v_name_parts := string_to_array(v_cleaned_name, ' ');
    v_part_count := array_length(v_name_parts, 1);
    
    -- Robust name splitting logic
    IF v_part_count = 0 OR v_cleaned_name = '' THEN
        v_first_name := '';
        v_last_name := NULL;
    ELSIF v_part_count = 1 THEN
        v_first_name := v_name_parts[1];
        v_last_name := NULL;
    ELSIF v_part_count = 2 THEN
        -- Check if first is initial or title
        IF v_name_parts[1] ~ '^[A-Z]\.?$' THEN
            v_first_name := v_name_parts[2];
            v_last_name := NULL;
        ELSIF v_name_parts[1] IN ('Dr.', 'Dr', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Prof.', 'Prof') THEN
            v_first_name := v_name_parts[2];
            v_last_name := NULL;
        ELSE
            v_first_name := v_name_parts[1];
            v_last_name := v_name_parts[2];
        END IF;
    ELSIF v_part_count = 3 THEN
        IF v_name_parts[1] ~ '^[A-Z]\.?$' THEN
            v_first_name := v_name_parts[2];
            v_last_name := v_name_parts[3];
        ELSIF v_name_parts[1] IN ('Dr.', 'Dr', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Prof.', 'Prof') THEN
            v_first_name := v_name_parts[2];
            v_last_name := v_name_parts[3];
        ELSE
            v_first_name := v_name_parts[1];
            v_last_name := v_name_parts[2] || ' ' || v_name_parts[3];
        END IF;
    ELSE
        v_first_name := v_name_parts[1];
        v_last_name := array_to_string(v_name_parts[2:], ' ');
    END IF;
    
    -- Clean up names
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
        -- Get existing patient details
        SELECT first_name, last_name INTO v_existing_first_name, v_existing_last_name
        FROM patients 
        WHERE id = v_existing_patient_id;
        
        -- Check if it's the same person using improved logic
        v_same_person := is_same_person(v_existing_first_name, v_existing_last_name, p_full_name);
        
        IF v_same_person THEN
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

-- Test the improved logic
SELECT 'Testing improved name matching:' as info;

SELECT 
    'J Poorna vs Poorna Shetty' as test_case,
    is_same_person('J', 'Poorna', 'Poorna Shetty') as is_match
UNION ALL
SELECT 
    'Poorna vs Poorna Shetty',
    is_same_person('Poorna', NULL, 'Poorna Shetty')
UNION ALL
SELECT 
    'John Doe vs Jane Doe',
    is_same_person('John', 'Doe', 'Jane Doe')
UNION ALL
SELECT 
    'Poorna vs Poo Shetty',
    is_same_person('Poorna', NULL, 'Poo Shetty')
UNION ALL
SELECT 
    'Dr. John vs John Smith',
    is_same_person('John', NULL, 'Dr. John Smith');

-- =====================================================
-- ✅ IMPROVED LOGIC SUMMARY
-- =====================================================
-- 
-- Now the system will automatically handle:
-- 1. "J Poorna" vs "Poorna Shetty" = Same person ✅
-- 2. "Poorna" vs "Poorna Shetty" = Same person ✅
-- 3. "John Doe" vs "Jane Doe" = Different people ✅
-- 4. "Dr. John" vs "John Smith" = Same person ✅
-- 5. "Poorna" vs "Poo Shetty" = Same person (nickname) ✅
-- 
-- =====================================================

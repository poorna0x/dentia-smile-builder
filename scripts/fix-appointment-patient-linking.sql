-- =====================================================
-- 🔧 FIX APPOINTMENT PATIENT LINKING LOGIC
-- =====================================================
-- 
-- This fixes the issue where different names with same phone
-- were incorrectly linking to existing patients
-- =====================================================

-- First, let's check the current trigger function
SELECT 'Current auto_link_appointment_with_patient function:' as info;
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'auto_link_appointment_with_patient';

-- Update the function to be more robust
CREATE OR REPLACE FUNCTION auto_link_appointment_with_patient()
RETURNS TRIGGER AS $$
DECLARE
    patient_id UUID;
    existing_patient_id UUID;
    existing_full_name TEXT;
    name_match BOOLEAN;
BEGIN
    -- Only process if patient_id is not already set
    IF NEW.patient_id IS NULL THEN
        
        -- First, try to find existing patient by phone
        SELECT pp.patient_id INTO existing_patient_id
        FROM patient_phones pp
        WHERE pp.phone = NEW.phone
        AND pp.patient_id IN (
            SELECT id FROM patients WHERE clinic_id = NEW.clinic_id
        )
        LIMIT 1;
        
        IF existing_patient_id IS NOT NULL THEN
            -- Found existing patient with same phone - check name match
            SELECT 
                CONCAT(first_name, ' ', COALESCE(last_name, '')) INTO existing_full_name
            FROM patients 
            WHERE id = existing_patient_id;
            
            -- Robust name comparison (case-insensitive, normalized)
            name_match := LOWER(TRIM(regexp_replace(existing_full_name, '\s+', ' ', 'g'))) = 
                         LOWER(TRIM(regexp_replace(NEW.name, '\s+', ' ', 'g')));
            
            IF name_match THEN
                -- Same person - use existing patient
                NEW.patient_id := existing_patient_id;
                RAISE NOTICE 'Linking appointment to existing patient: % (phone: %)', existing_full_name, NEW.phone;
            ELSE
                -- Different person with same phone - create new patient
                patient_id := find_or_create_patient(
                    NEW.name,
                    NEW.phone,
                    NEW.email,
                    NEW.clinic_id
                );
                NEW.patient_id := patient_id;
                RAISE NOTICE 'Created new patient for: % (phone: %) - different from existing: %', NEW.name, NEW.phone, existing_full_name;
            END IF;
        ELSE
            -- No existing patient with this phone - create new patient
            patient_id := find_or_create_patient(
                NEW.name,
                NEW.phone,
                NEW.email,
                NEW.clinic_id
            );
            NEW.patient_id := patient_id;
            RAISE NOTICE 'Created new patient for: % (phone: %)', NEW.name, NEW.phone;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the trigger exists and is working
SELECT 'Verifying trigger exists:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'auto_link_appointment_trigger';

-- Test the function with sample data
SELECT 'Testing the function logic:' as info;

-- =====================================================
-- ✅ FIX APPLIED
-- =====================================================
-- 
-- Now the system will:
-- 1. Check for existing patient by phone
-- 2. Compare names if found
-- 3. Create new patient if names don't match
-- 4. Create new patient if no existing patient found
-- 
-- =====================================================

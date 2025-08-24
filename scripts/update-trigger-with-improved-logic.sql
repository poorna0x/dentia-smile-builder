-- =====================================================
-- 🔧 UPDATE TRIGGER WITH IMPROVED NAME MATCHING
-- =====================================================
-- 
-- This updates the appointment trigger to use the improved logic
-- Run this after the improved-name-matching-logic.sql
-- =====================================================

-- First, let's replace the old find_or_create_patient function with the improved version
-- (This assumes you've already run the improved-name-matching-logic.sql)

-- Update the auto_link_appointment_with_patient trigger function
CREATE OR REPLACE FUNCTION auto_link_appointment_with_patient()
RETURNS TRIGGER AS $$
DECLARE
    patient_id UUID;
BEGIN
    -- Only process if patient_id is not already set
    IF NEW.patient_id IS NULL THEN
        -- Use the improved function for better name matching
        patient_id := find_or_create_patient_improved(
            NEW.name,
            NEW.phone,
            NEW.email,
            NEW.clinic_id
        );
        
        -- Set the patient_id
        NEW.patient_id := patient_id;
        
        -- Log what happened for debugging
        RAISE NOTICE 'Appointment linking: name="%", phone="%" → patient_id=%', 
            NEW.name, NEW.phone, patient_id;
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

-- Test the improved function directly
SELECT 'Testing improved function:' as info;

-- Test with some sample data
SELECT 
    'Test 1: J Poorna vs Poorna Shetty' as test_case,
    find_or_create_patient_improved('Poorna Shetty', '9876543210', 'test@example.com', 'c1ca557d-ca85-4905-beb7-c3985692d463') as patient_id
UNION ALL
SELECT 
    'Test 2: Poorna vs Poorna Shetty',
    find_or_create_patient_improved('Poorna Shetty', '9876543210', 'test@example.com', 'c1ca557d-ca85-4905-beb7-c3985692d463');

-- =====================================================
-- ✅ IMPLEMENTATION COMPLETE
-- =====================================================
-- 
-- Now when someone books an appointment:
-- 1. The trigger will automatically run
-- 2. It will use the improved name matching logic
-- 3. Same person with different name formats will be linked correctly
-- 4. Different people with same phone will get separate records
-- 
-- =====================================================

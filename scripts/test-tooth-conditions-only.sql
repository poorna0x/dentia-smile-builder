-- Test Tooth Conditions Only (No Treatments)
-- This script adds only tooth conditions to test if they show up in the dental chart

-- First, let's get a clinic and patient to work with
DO $$
DECLARE
    clinic_id UUID;
    patient_id UUID;
BEGIN
    -- Get or create a clinic
    SELECT id INTO clinic_id FROM clinics LIMIT 1;
    IF clinic_id IS NULL THEN
        INSERT INTO clinics (name, contact_phone, address, email) 
        VALUES ('Test Dental Clinic', '9876543210', '123 Test Street', 'test@clinic.com')
        RETURNING id INTO clinic_id;
    END IF;
    
    -- Get or create a patient
    SELECT id INTO patient_id FROM patients WHERE phone = '9876543210' LIMIT 1;
    IF patient_id IS NULL THEN
        INSERT INTO patients (clinic_id, first_name, last_name, phone, email, date_of_birth, gender)
        VALUES (clinic_id, 'John', 'Doe', '9876543210', 'john@test.com', '1990-01-01', 'Male')
        RETURNING id INTO patient_id;
    END IF;
    
    -- Add ONLY tooth conditions (no treatments)
    INSERT INTO tooth_conditions (
        clinic_id, patient_id, tooth_number, tooth_position, condition_type, condition_description, 
        severity, notes, created_at
    ) VALUES 
    (clinic_id, patient_id, '5', 'Upper Right', 'Cavity', 'Small cavity detected during checkup', 
     'Mild', 'Monitor for progression', NOW()),
    (clinic_id, patient_id, '12', 'Upper Left', 'Sensitivity', 'Cold sensitivity reported by patient', 
     'Moderate', 'Recommend desensitizing toothpaste', NOW()),
    (clinic_id, patient_id, '20', 'Lower Left', 'Crack', 'Hairline crack detected on chewing surface', 
     'Severe', 'May require crown if worsens', NOW()),
    (clinic_id, patient_id, '28', 'Lower Right', 'Decay', 'Deep decay requiring immediate attention', 
     'Severe', 'Patient experiencing pain', NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Tooth conditions only test data added successfully!';
    RAISE NOTICE 'Clinic ID: %', clinic_id;
    RAISE NOTICE 'Patient ID: %', patient_id;
    RAISE NOTICE 'Test phone number: 9876543210';
    RAISE NOTICE 'Added conditions for teeth: 5, 12, 20, 28';
END $$;

-- Verify the data was added
SELECT 'Verification - Tooth Conditions Only' as info, COUNT(*) as count FROM tooth_conditions;

-- Show the specific conditions added
SELECT 
    tooth_number,
    condition_type,
    severity,
    condition_description,
    created_at
FROM tooth_conditions 
WHERE patient_id = (SELECT id FROM patients WHERE phone = '9876543210' LIMIT 1)
ORDER BY tooth_number;

-- Test the queries that the component uses
SELECT 'Testing dental_treatments query' as test_name;
SELECT COUNT(*) as treatments_count 
FROM dental_treatments 
WHERE patient_id = (SELECT id FROM patients WHERE phone = '9876543210' LIMIT 1);

SELECT 'Testing tooth_conditions query' as test_name;
SELECT COUNT(*) as conditions_count 
FROM tooth_conditions 
WHERE patient_id = (SELECT id FROM patients WHERE phone = '9876543210' LIMIT 1);

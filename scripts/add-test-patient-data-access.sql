-- Add Test Data for Patient Data Access Testing
-- This script adds sample data to test the patient portal functionality

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
    
    -- Add sample dental treatments
    INSERT INTO dental_treatments (
        clinic_id, patient_id, tooth_number, tooth_position, treatment_type, treatment_description, 
        treatment_status, treatment_date, cost, notes, created_by
    ) VALUES 
    (clinic_id, patient_id, '8', 'Upper Right', 'Filling', 'Composite filling for cavity', 
     'Completed', CURRENT_DATE - INTERVAL '30 days', 1500.00, 'Patient tolerated well', 'Dr. Smith'),
    (clinic_id, patient_id, '14', 'Upper Left', 'Root Canal', 'Root canal treatment for severe pain', 
     'In Progress', CURRENT_DATE - INTERVAL '15 days', 8000.00, 'Requires follow-up', 'Dr. Smith'),
    (clinic_id, patient_id, '25', 'Lower Right', 'Crown', 'Porcelain crown placement', 
     'Completed', CURRENT_DATE - INTERVAL '7 days', 12000.00, 'Excellent fit', 'Dr. Smith')
    ON CONFLICT DO NOTHING;
    
    -- Add sample tooth conditions
    INSERT INTO tooth_conditions (
        clinic_id, patient_id, tooth_number, tooth_position, condition_type, condition_description, 
        severity, notes, created_at
    ) VALUES 
    (clinic_id, patient_id, '3', 'Upper Right', 'Cavity', 'Small cavity detected during checkup', 
     'Mild', 'Monitor for progression', NOW()),
    (clinic_id, patient_id, '19', 'Lower Left', 'Sensitivity', 'Cold sensitivity reported by patient', 
     'Moderate', 'Recommend desensitizing toothpaste', NOW()),
    (clinic_id, patient_id, '30', 'Lower Right', 'Crack', 'Hairline crack detected on chewing surface', 
     'Severe', 'May require crown if worsens', NOW())
    ON CONFLICT DO NOTHING;
    
    -- Add sample lab work
    INSERT INTO lab_work (
        clinic_id, patient_id, lab_name, work_type, description, status, 
        order_date, expected_completion_date, cost, notes, created_by
    ) VALUES 
    (clinic_id, patient_id, 'Dental Lab Pro', 'Crown', 'Porcelain crown for tooth 14', 
     'In Progress', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '5 days', 
     5000.00, 'High priority - patient in pain', 'Dr. Smith'),
    (clinic_id, patient_id, 'Quality Dental Lab', 'Bridge', '3-unit bridge for missing teeth', 
     'Ordered', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '15 days', 
     15000.00, 'Patient prefers natural color', 'Dr. Smith'),
    (clinic_id, patient_id, 'Precision Lab', 'Implant Crown', 'Crown for implant on tooth 30', 
     'Ready for Pickup', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '2 days', 
     8000.00, 'Ready for final fitting', 'Dr. Smith')
    ON CONFLICT DO NOTHING;
    
    -- Add sample appointment
    INSERT INTO appointments (
        clinic_id, patient_id, name, phone, date, time, service, status, notes
    ) VALUES 
    (clinic_id, patient_id, 'John Doe', '9876543210', 
     CURRENT_DATE + INTERVAL '7 days', '10:00', 'Follow-up', 'Confirmed', 'Check crown fitting')
    ON CONFLICT DO NOTHING;
    
    -- Add sample prescription
    INSERT INTO prescriptions (
        clinic_id, patient_id, medication_name, dosage, frequency, duration, 
        instructions, prescribed_date, status, prescribed_by, refills_remaining, notes
    ) VALUES 
    (clinic_id, patient_id, 'Amoxicillin', '500mg', '3 times daily', '7 days', 
     'Take with food', CURRENT_DATE - INTERVAL '5 days', 'Active', 'Dr. Smith', 0, 
     'For post-treatment infection prevention')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test data added successfully!';
    RAISE NOTICE 'Clinic ID: %', clinic_id;
    RAISE NOTICE 'Patient ID: %', patient_id;
    RAISE NOTICE 'Test phone number: 9876543210';
END $$;

-- Verify the data was added
SELECT 'Verification - Dental Treatments' as info, COUNT(*) as count FROM dental_treatments;
SELECT 'Verification - Tooth Conditions' as info, COUNT(*) as count FROM tooth_conditions;
SELECT 'Verification - Lab Work' as info, COUNT(*) as count FROM lab_work;
SELECT 'Verification - Appointments' as info, COUNT(*) as count FROM appointments;
SELECT 'Verification - Prescriptions' as info, COUNT(*) as count FROM prescriptions;

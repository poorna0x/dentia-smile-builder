-- Add Sample Dental Data for Testing
-- Run this in Supabase SQL Editor

-- Get clinic and patient IDs
WITH clinic_patient AS (
    SELECT 
        'c1ca557d-ca85-4905-beb7-c3985692d463' as clinic_id,
        p.id as patient_id,
        p.first_name,
        p.last_name
    FROM patients p
    WHERE p.clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
    LIMIT 1
)

-- Insert sample dental treatments
INSERT INTO dental_treatments (
    clinic_id,
    patient_id,
    tooth_number,
    tooth_position,
    treatment_type,
    treatment_description,
    treatment_status,
    treatment_date,
    notes,
    created_by
)
SELECT 
    cp.clinic_id,
    cp.patient_id,
    '11',
    'Upper Right',
    'Cleaning',
    'Regular dental cleaning and checkup',
    'Completed',
    CURRENT_DATE - INTERVAL '30 days',
    'Patient had good oral hygiene, no issues found',
    'Dr. Jeshna'
FROM clinic_patient cp
ON CONFLICT DO NOTHING;

INSERT INTO dental_treatments (
    clinic_id,
    patient_id,
    tooth_number,
    tooth_position,
    treatment_type,
    treatment_description,
    treatment_status,
    treatment_date,
    notes,
    created_by
)
SELECT 
    cp.clinic_id,
    cp.patient_id,
    '16',
    'Upper Left',
    'Filling',
    'Composite filling for cavity',
    'Completed',
    CURRENT_DATE - INTERVAL '15 days',
    'Cavity was moderate, filled successfully',
    'Dr. Jeshna'
FROM clinic_patient cp
ON CONFLICT DO NOTHING;

INSERT INTO dental_treatments (
    clinic_id,
    patient_id,
    tooth_number,
    tooth_position,
    treatment_type,
    treatment_description,
    treatment_status,
    treatment_date,
    notes,
    created_by
)
SELECT 
    cp.clinic_id,
    cp.patient_id,
    '31',
    'Lower Left',
    'Root Canal',
    'Root canal treatment for severe decay',
    'In Progress',
    CURRENT_DATE,
    'Patient experiencing pain, treatment in progress',
    'Dr. Jeshna'
FROM clinic_patient cp
ON CONFLICT DO NOTHING;

-- Insert sample tooth conditions
INSERT INTO tooth_conditions (
    clinic_id,
    patient_id,
    tooth_number,
    tooth_position,
    condition_type,
    condition_description,
    severity,
    notes
)
SELECT 
    cp.clinic_id,
    cp.patient_id,
    '11',
    'Upper Right',
    'Healthy',
    'No issues detected',
    'Mild',
    'Regular checkup - healthy'
FROM clinic_patient cp
ON CONFLICT DO NOTHING;

INSERT INTO tooth_conditions (
    clinic_id,
    patient_id,
    tooth_number,
    tooth_position,
    condition_type,
    condition_description,
    severity,
    notes
)
SELECT 
    cp.clinic_id,
    cp.patient_id,
    '16',
    'Upper Left',
    'Filled',
    'Composite filling in place',
    'Mild',
    'Filling is holding well'
FROM clinic_patient cp
ON CONFLICT DO NOTHING;

INSERT INTO tooth_conditions (
    clinic_id,
    patient_id,
    tooth_number,
    tooth_position,
    condition_type,
    condition_description,
    severity,
    notes
)
SELECT 
    cp.clinic_id,
    cp.patient_id,
    '31',
    'Lower Left',
    'Infected',
    'Severe decay requiring root canal',
    'Severe',
    'Patient experiencing pain, treatment ongoing'
FROM clinic_patient cp
ON CONFLICT DO NOTHING;

-- Show the created data
SELECT 'DENTAL DATA CREATED SUCCESSFULLY' as status;

SELECT 
    'dental_treatments' as table_name,
    dt.tooth_number,
    dt.treatment_type,
    dt.treatment_status,
    dt.treatment_date,
    p.first_name || ' ' || p.last_name as patient_name
FROM dental_treatments dt
JOIN patients p ON dt.patient_id = p.id
WHERE dt.clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
ORDER BY dt.treatment_date DESC;

SELECT 
    'tooth_conditions' as table_name,
    tc.tooth_number,
    tc.condition_type,
    tc.severity,
    tc.last_updated,
    p.first_name || ' ' || p.last_name as patient_name
FROM tooth_conditions tc
JOIN patients p ON tc.patient_id = p.id
WHERE tc.clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
ORDER BY tc.tooth_number;

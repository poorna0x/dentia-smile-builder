-- Test Dental Data
-- Run this in Supabase SQL Editor to add sample dental data

-- Get patient and clinic IDs
WITH patient_data AS (
    SELECT 
        p.id as patient_id,
        c.id as clinic_id
    FROM patients p
    CROSS JOIN clinics c
    WHERE p.phone = '6361631253'
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
    cost,
    notes,
    created_by
)
SELECT 
    pd.clinic_id,
    pd.patient_id,
    '11',
    'Upper Right',
    'Cleaning',
    'Regular dental cleaning and checkup',
    'Completed',
    '2024-01-15'::DATE,
    50.00,
    'Patient had good oral hygiene',
    'Dr. Smith'
FROM patient_data pd

UNION ALL

SELECT 
    pd.clinic_id,
    pd.patient_id,
    '16',
    'Upper Left',
    'Filling',
    'Composite filling for cavity',
    'Completed',
    '2024-01-20'::DATE,
    150.00,
    'Cavity was moderate, filled successfully',
    'Dr. Smith'
FROM patient_data pd

UNION ALL

SELECT 
    pd.clinic_id,
    pd.patient_id,
    '31',
    'Lower Left',
    'Root Canal',
    'Root canal treatment for severe decay',
    'In Progress',
    '2024-02-01'::DATE,
    800.00,
    'Patient experiencing pain, treatment in progress',
    'Dr. Johnson'
FROM patient_data pd

UNION ALL

SELECT 
    pd.clinic_id,
    pd.patient_id,
    '26',
    'Lower Right',
    'Crown',
    'Porcelain crown placement',
    'Planned',
    '2024-02-15'::DATE,
    1200.00,
    'Crown preparation completed, final placement scheduled',
    'Dr. Johnson'
FROM patient_data pd;

-- Insert sample tooth conditions
WITH patient_data_conditions AS (
    SELECT 
        p.id as patient_id,
        c.id as clinic_id
    FROM patients p
    CROSS JOIN clinics c
    WHERE p.phone = '6361631253'
    LIMIT 1
)
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
    pd.clinic_id,
    pd.patient_id,
    '11',
    'Upper Right',
    'Healthy',
    'No issues detected',
    'Mild',
    'Regular checkup - healthy'
FROM patient_data_conditions pd

UNION ALL

SELECT 
    pd.clinic_id,
    pd.patient_id,
    '16',
    'Upper Left',
    'Filled',
    'Composite filling in place',
    'Mild',
    'Filling is holding well'
FROM patient_data_conditions pd

UNION ALL

SELECT 
    pd.clinic_id,
    pd.patient_id,
    '31',
    'Lower Left',
    'Infected',
    'Severe decay requiring root canal',
    'Severe',
    'Patient experiencing pain, treatment ongoing'
FROM patient_data_conditions pd

UNION ALL

SELECT 
    pd.clinic_id,
    pd.patient_id,
    '26',
    'Lower Right',
    'Crown',
    'Crown preparation completed',
    'Moderate',
    'Ready for final crown placement'
FROM patient_data_conditions pd

UNION ALL

SELECT 
    pd.clinic_id,
    pd.patient_id,
    '14',
    'Upper Right',
    'Cavity',
    'Small cavity detected',
    'Mild',
    'Monitor for progression'
FROM patient_data_conditions pd

UNION ALL

SELECT 
    pd.clinic_id,
    pd.patient_id,
    '22',
    'Upper Left',
    'Sensitive',
    'Tooth sensitivity to cold',
    'Mild',
    'Recommend sensitivity toothpaste'
FROM patient_data_conditions pd;

-- Show the created data
SELECT 'DENTAL TREATMENTS CREATED' as status;
SELECT 
    dt.tooth_number,
    dt.treatment_type,
    dt.treatment_status,
    dt.treatment_date,
    dt.cost
FROM dental_treatments dt
JOIN patients p ON dt.patient_id = p.id
WHERE p.phone = '6361631253'
ORDER BY dt.treatment_date DESC;

SELECT 'TOOTH CONDITIONS CREATED' as status;
SELECT 
    tc.tooth_number,
    tc.condition_type,
    tc.severity,
    tc.last_updated
FROM tooth_conditions tc
JOIN patients p ON tc.patient_id = p.id
WHERE p.phone = '6361631253'
ORDER BY tc.tooth_number;

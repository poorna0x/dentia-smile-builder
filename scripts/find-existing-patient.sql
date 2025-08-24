-- Find Existing Patient Data
-- This script helps find existing patients and their data for testing

-- 1. Find all patients with their phone numbers
SELECT 'All Patients' as info;
SELECT 
    id as patient_id,
    first_name,
    last_name,
    phone,
    email,
    created_at
FROM patients 
ORDER BY created_at DESC;

-- 2. Find patients who have dental treatments
SELECT 'Patients with Dental Treatments' as info;
SELECT DISTINCT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.phone,
    COUNT(dt.id) as treatment_count
FROM patients p
JOIN dental_treatments dt ON p.id = dt.patient_id
GROUP BY p.id, p.first_name, p.last_name, p.phone
ORDER BY treatment_count DESC;

-- 3. Find patients who have tooth conditions
SELECT 'Patients with Tooth Conditions' as info;
SELECT DISTINCT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.phone,
    COUNT(tc.id) as condition_count
FROM patients p
JOIN tooth_conditions tc ON p.id = tc.patient_id
GROUP BY p.id, p.first_name, p.last_name, p.phone
ORDER BY condition_count DESC;

-- 4. Find patients who have lab work
SELECT 'Patients with Lab Work' as info;
SELECT DISTINCT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.phone,
    COUNT(lw.id) as lab_work_count
FROM patients p
JOIN lab_work lw ON p.id = lw.patient_id
GROUP BY p.id, p.first_name, p.last_name, p.phone
ORDER BY lab_work_count DESC;

-- 5. Find patients who have appointments
SELECT 'Patients with Appointments' as info;
SELECT DISTINCT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.phone,
    COUNT(a.id) as appointment_count
FROM patients p
JOIN appointments a ON p.id = a.patient_id
GROUP BY p.id, p.first_name, p.last_name, p.phone
ORDER BY appointment_count DESC;

-- 6. Find patients who have prescriptions
SELECT 'Patients with Prescriptions' as info;
SELECT DISTINCT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.phone,
    COUNT(pr.id) as prescription_count
FROM patients p
JOIN prescriptions pr ON p.id = pr.patient_id
GROUP BY p.id, p.first_name, p.last_name, p.phone
ORDER BY prescription_count DESC;

-- 7. Show sample data for the first patient with conditions
SELECT 'Sample Data for First Patient with Conditions' as info;
SELECT 
    p.first_name,
    p.last_name,
    p.phone,
    tc.tooth_number,
    tc.condition_type,
    tc.severity,
    tc.condition_description
FROM patients p
JOIN tooth_conditions tc ON p.id = tc.patient_id
ORDER BY p.created_at DESC, tc.tooth_number
LIMIT 10;

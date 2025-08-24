-- Debug Patient Data Access Issues
-- This script helps identify why dental chart and lab work data is not showing

-- 1. Check if we have any clinics
SELECT 'Clinics' as table_name, COUNT(*) as count FROM clinics;

-- 2. Check if we have any patients
SELECT 'Patients' as table_name, COUNT(*) as count FROM patients;

-- 3. Check if we have any dental treatments
SELECT 'Dental Treatments' as table_name, COUNT(*) as count FROM dental_treatments;

-- 4. Check if we have any tooth conditions
SELECT 'Tooth Conditions' as table_name, COUNT(*) as count FROM tooth_conditions;

-- 5. Check if we have any lab work
SELECT 'Lab Work' as table_name, COUNT(*) as count FROM lab_work;

-- 6. Check if we have any appointments
SELECT 'Appointments' as table_name, COUNT(*) as count FROM appointments;

-- 7. Check if we have any prescriptions
SELECT 'Prescriptions' as table_name, COUNT(*) as count FROM prescriptions;

-- 8. Sample data from each table (if exists)
SELECT 'Sample Dental Treatments' as info, 
       id, patient_id, clinic_id, tooth_number, treatment_type, treatment_status, created_at 
FROM dental_treatments 
LIMIT 3;

SELECT 'Sample Tooth Conditions' as info, 
       id, patient_id, clinic_id, tooth_number, condition_type, severity, created_at 
FROM tooth_conditions 
LIMIT 3;

SELECT 'Sample Lab Work' as info, 
       id, patient_id, clinic_id, work_type, status, order_date, expected_completion_date 
FROM lab_work 
LIMIT 3;

-- 9. Test the get_patient_by_phone function
-- Replace '1234567890' with an actual phone number from your patients table
SELECT 'Testing get_patient_by_phone function' as info;
-- SELECT * FROM get_patient_by_phone('1234567890', (SELECT id FROM clinics LIMIT 1));

-- 10. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('dental_treatments', 'tooth_conditions', 'lab_work', 'patients', 'appointments', 'prescriptions');

-- 11. Check if tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('dental_treatments', 'tooth_conditions', 'lab_work', 'patients', 'appointments', 'prescriptions');

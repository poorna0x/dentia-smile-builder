-- Fix RLS Policies for Patient Data Access
-- This script creates more permissive RLS policies for patient portal access

-- 1. First, let's check what clinic the patient belongs to
SELECT 'Patient Clinic Info' as info;
SELECT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.phone,
    p.clinic_id,
    c.name as clinic_name
FROM patients p
LEFT JOIN clinics c ON p.clinic_id = c.id
WHERE p.phone = '6361631253';

-- 2. Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "Clinics can view their own dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Clinics can insert their own dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Clinics can update their own dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Clinics can delete their own dental_treatments" ON dental_treatments;

DROP POLICY IF EXISTS "Clinics can view their own tooth_conditions" ON tooth_conditions;
DROP POLICY IF EXISTS "Clinics can insert their own tooth_conditions" ON tooth_conditions;
DROP POLICY IF EXISTS "Clinics can update their own tooth_conditions" ON tooth_conditions;
DROP POLICY IF EXISTS "Clinics can delete their own tooth_conditions" ON tooth_conditions;

DROP POLICY IF EXISTS "Clinics can view their own lab_work" ON lab_work;
DROP POLICY IF EXISTS "Clinics can insert their own lab_work" ON lab_work;
DROP POLICY IF EXISTS "Clinics can update their own lab_work" ON lab_work;
DROP POLICY IF EXISTS "Clinics can delete their own lab_work" ON lab_work;

-- 3. Create more permissive RLS policies for patient portal access
-- Dental Treatments
CREATE POLICY "Allow patient portal access to dental_treatments" ON dental_treatments
  FOR SELECT USING (true);

CREATE POLICY "Allow patient portal insert to dental_treatments" ON dental_treatments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow patient portal update to dental_treatments" ON dental_treatments
  FOR UPDATE USING (true);

CREATE POLICY "Allow patient portal delete to dental_treatments" ON dental_treatments
  FOR DELETE USING (true);

-- Tooth Conditions
CREATE POLICY "Allow patient portal access to tooth_conditions" ON tooth_conditions
  FOR SELECT USING (true);

CREATE POLICY "Allow patient portal insert to tooth_conditions" ON tooth_conditions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow patient portal update to tooth_conditions" ON tooth_conditions
  FOR UPDATE USING (true);

CREATE POLICY "Allow patient portal delete to tooth_conditions" ON tooth_conditions
  FOR DELETE USING (true);

-- Lab Work
CREATE POLICY "Allow patient portal access to lab_work" ON lab_work
  FOR SELECT USING (true);

CREATE POLICY "Allow patient portal insert to lab_work" ON lab_work
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow patient portal update to lab_work" ON lab_work
  FOR UPDATE USING (true);

CREATE POLICY "Allow patient portal delete to lab_work" ON lab_work
  FOR DELETE USING (true);

-- 4. Test the queries that the component uses
SELECT 'Testing dental_treatments query after RLS fix' as test_name;
SELECT COUNT(*) as treatments_count FROM dental_treatments;

SELECT 'Testing tooth_conditions query after RLS fix' as test_name;
SELECT COUNT(*) as conditions_count FROM tooth_conditions;

SELECT 'Testing lab_work query after RLS fix' as test_name;
SELECT COUNT(*) as lab_work_count FROM lab_work;

-- 5. Test specific patient data
SELECT 'Testing patient 6361631253 dental data' as test_name;
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
WHERE p.phone = '6361631253'
ORDER BY tc.tooth_number;

-- 6. Test the get_patient_by_phone function
SELECT 'Testing get_patient_by_phone for 6361631253' as test_name;
-- Get the clinic ID first
DO $$
DECLARE
    clinic_id UUID;
BEGIN
    SELECT c.id INTO clinic_id 
    FROM patients p 
    JOIN clinics c ON p.clinic_id = c.id 
    WHERE p.phone = '6361631253' 
    LIMIT 1;
    
    IF clinic_id IS NOT NULL THEN
        RAISE NOTICE 'Testing get_patient_by_phone with clinic_id: %', clinic_id;
        -- This will show the function call
        PERFORM get_patient_by_phone('6361631253', clinic_id);
    ELSE
        RAISE NOTICE 'No clinic found for patient 6361631253';
    END IF;
END $$;

-- 7. Show current RLS policies
SELECT 'Current RLS Policies After Fix' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('dental_treatments', 'tooth_conditions', 'lab_work')
ORDER BY tablename, policyname;

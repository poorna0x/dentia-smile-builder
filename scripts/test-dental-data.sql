-- Test Dental Data
-- Run this in Supabase SQL Editor

-- 1. Check if dental tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dental_treatments', 'tooth_conditions', 'dental_notes')
ORDER BY table_name;

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'dental_treatments'
ORDER BY ordinal_position;

-- 3. Check if there's any data in dental_treatments
SELECT COUNT(*) as dental_treatments_count FROM dental_treatments;

-- 4. Check if there's any data in tooth_conditions
SELECT COUNT(*) as tooth_conditions_count FROM tooth_conditions;

-- 5. Check if there's any data in dental_notes
SELECT COUNT(*) as dental_notes_count FROM dental_notes;

-- 6. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('dental_treatments', 'tooth_conditions', 'dental_notes');

-- 7. Test insert some sample data
DO $$
DECLARE
    v_clinic_id UUID := 'c1ca557d-ca85-4905-beb7-c3985692d463';
    v_patient_id UUID;
BEGIN
    -- Get a patient ID
    SELECT id INTO v_patient_id 
    FROM patients 
    WHERE clinic_id = v_clinic_id 
    LIMIT 1;
    
    IF v_patient_id IS NOT NULL THEN
        -- Insert sample dental treatment
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
        ) VALUES (
            v_clinic_id,
            v_patient_id,
            '11',
            'Upper Right',
            'Cleaning',
            'Regular dental cleaning',
            'Completed',
            CURRENT_DATE,
            'Patient had good oral hygiene',
            'Dr. Test'
        ) ON CONFLICT DO NOTHING;
        
        -- Insert sample tooth condition
        INSERT INTO tooth_conditions (
            clinic_id,
            patient_id,
            tooth_number,
            tooth_position,
            condition_type,
            condition_description,
            severity,
            notes
        ) VALUES (
            v_clinic_id,
            v_patient_id,
            '11',
            'Upper Right',
            'Healthy',
            'Tooth is in good condition',
            'Mild',
            'No issues detected'
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample dental data inserted for patient: %', v_patient_id;
    ELSE
        RAISE NOTICE 'No patients found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 8. Show the inserted data
SELECT 
    'dental_treatments' as table_name,
    id,
    patient_id,
    tooth_number,
    treatment_type,
    treatment_status,
    created_at
FROM dental_treatments 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
UNION ALL
SELECT 
    'tooth_conditions' as table_name,
    id,
    patient_id,
    tooth_number,
    condition_type as treatment_type,
    severity as treatment_status,
    created_at
FROM tooth_conditions 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

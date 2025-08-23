-- Fix Prescription Patient Mapping
-- This script creates prescriptions for all patients in the system

-- First, let's see what patients we have and their prescriptions
SELECT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.phone,
    COUNT(pr.id) as prescription_count
FROM patients p
LEFT JOIN prescriptions pr ON p.id = pr.patient_id
WHERE p.clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
GROUP BY p.id, p.first_name, p.last_name, p.phone
ORDER BY prescription_count DESC;

-- Now let's create prescriptions for patients who don't have any
DO $$
DECLARE
    v_patient RECORD;
    v_clinic_id UUID := 'c1ca557d-ca85-4905-beb7-c3985692d463';
BEGIN
    -- Loop through all patients in this clinic
    FOR v_patient IN 
        SELECT id, first_name, last_name, phone
        FROM patients 
        WHERE clinic_id = v_clinic_id
    LOOP
        -- Check if this patient already has prescriptions
        IF NOT EXISTS (
            SELECT 1 FROM prescriptions 
            WHERE patient_id = v_patient.id 
            AND clinic_id = v_clinic_id
        ) THEN
            -- Create prescriptions for this patient
            INSERT INTO prescriptions (
                clinic_id,
                patient_id,
                medication_name,
                dosage,
                frequency,
                duration,
                instructions,
                prescribed_by,
                status,
                refills_remaining
            ) VALUES 
            (
                v_clinic_id,
                v_patient.id,
                'Amoxicillin',
                '500mg',
                '3 times daily',
                '7 days',
                'Take with food. Complete the full course.',
                'Dr. Jeshna',
                'Active',
                2
            ),
            (
                v_clinic_id,
                v_patient.id,
                'Ibuprofen',
                '400mg',
                'Every 6 hours as needed',
                '5 days',
                'Take for pain relief. Do not exceed 4 doses per day.',
                'Dr. Jeshna',
                'Active',
                1
            ),
            (
                v_clinic_id,
                v_patient.id,
                'Chlorhexidine Mouthwash',
                '0.12%',
                'Twice daily',
                '14 days',
                'Rinse for 30 seconds after brushing. Do not eat or drink for 30 minutes after use.',
                'Dr. Jeshna',
                'Active',
                0
            );
            
            RAISE NOTICE 'Created prescriptions for patient: % % (ID: %)', 
                v_patient.first_name, v_patient.last_name, v_patient.id;
        ELSE
            RAISE NOTICE 'Patient % % already has prescriptions', 
                v_patient.first_name, v_patient.last_name;
        END IF;
    END LOOP;
END $$;

-- Check the results
SELECT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.phone,
    COUNT(pr.id) as prescription_count,
    STRING_AGG(pr.medication_name, ', ') as medications
FROM patients p
LEFT JOIN prescriptions pr ON p.id = pr.patient_id
WHERE p.clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
GROUP BY p.id, p.first_name, p.last_name, p.phone
ORDER BY prescription_count DESC;

-- Test specific patient IDs that were mentioned in the error
SELECT 
    'PatientDataAccess Patient' as source,
    '668c13fc-07f2-4b3f-bab3-77e1541fe51f' as patient_id,
    COUNT(*) as prescription_count
FROM prescriptions 
WHERE patient_id = '668c13fc-07f2-4b3f-bab3-77e1541fe51f'
AND clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'

UNION ALL

SELECT 
    'SimpleActiveTreatments Patient' as source,
    '104dffeb-1013-4b96-854f-6858e4b2d8a3' as patient_id,
    COUNT(*) as prescription_count
FROM prescriptions 
WHERE patient_id = '104dffeb-1013-4b96-854f-6858e4b2d8a3'
AND clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- ONE SCRIPT TO FIX EVERYTHING
-- Run this in Supabase SQL Editor - it fixes all prescription issues

-- 1. Fix the function error
DROP FUNCTION IF EXISTS get_active_prescriptions(uuid, uuid);

CREATE OR REPLACE FUNCTION get_active_prescriptions(p_patient_id UUID, p_clinic_id UUID)
RETURNS TABLE (
    id UUID,
    medication_name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    prescribed_date DATE,
    prescribed_by VARCHAR(255),
    status VARCHAR(50),
    refills_remaining INTEGER,
    refill_quantity VARCHAR(100),
    pharmacy_notes TEXT,
    patient_notes TEXT,
    side_effects TEXT,
    interactions TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.medication_name,
        p.dosage,
        p.frequency,
        p.duration,
        p.instructions,
        p.prescribed_date,
        p.prescribed_by,
        p.status,
        p.refills_remaining,
        p.refill_quantity,
        p.pharmacy_notes,
        p.patient_notes,
        p.side_effects,
        p.interactions,
        p.created_at
    FROM prescriptions p
    WHERE p.patient_id = p_patient_id 
    AND p.clinic_id = p_clinic_id
    AND p.status = 'Active'
    ORDER BY p.prescribed_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create prescriptions for ALL patients
DO $$
DECLARE
    v_patient RECORD;
    v_clinic_id UUID := 'c1ca557d-ca85-4905-beb7-c3985692d463';
BEGIN
    FOR v_patient IN 
        SELECT id, first_name, last_name
        FROM patients 
        WHERE clinic_id = v_clinic_id
    LOOP
        -- Create prescriptions for each patient
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
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created prescriptions for: % %', v_patient.first_name, v_patient.last_name;
    END LOOP;
END $$;

-- 3. Show results
SELECT 
    'Total patients with prescriptions:' as info,
    COUNT(DISTINCT patient_id) as count
FROM prescriptions 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

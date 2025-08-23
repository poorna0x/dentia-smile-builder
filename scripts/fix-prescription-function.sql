-- Fix Prescription Function Return Type Error
-- Drop and recreate the function to fix the return type issue

-- Drop the existing function
DROP FUNCTION IF EXISTS get_active_prescriptions(uuid, uuid);

-- Recreate the function with correct return type
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

-- Test the function
SELECT * FROM get_active_prescriptions(
    (SELECT id FROM patients WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463' LIMIT 1),
    'c1ca557d-ca85-4905-beb7-c3985692d463'
);

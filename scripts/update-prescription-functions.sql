-- Update prescription functions to remove prescribed_by references
-- Run this in Supabase SQL Editor

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_active_prescriptions(UUID, UUID);
DROP FUNCTION IF EXISTS create_prescription_with_history(UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR, TEXT, TEXT, TEXT, TEXT);

-- Create updated get_active_prescriptions function
CREATE OR REPLACE FUNCTION get_active_prescriptions(p_patient_id UUID, p_clinic_id UUID)
RETURNS TABLE (
    id UUID,
    medication_name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    prescribed_date DATE,
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

-- Create updated create_prescription_with_history function
CREATE OR REPLACE FUNCTION create_prescription_with_history(
    p_clinic_id UUID,
    p_patient_id UUID,
    p_medication_name VARCHAR(255),
    p_dosage VARCHAR(100),
    p_frequency VARCHAR(100),
    p_duration VARCHAR(100),
    p_instructions TEXT,
    p_refills_remaining INTEGER DEFAULT 0,
    p_refill_quantity VARCHAR(100) DEFAULT NULL,
    p_pharmacy_notes TEXT DEFAULT NULL,
    p_patient_notes TEXT DEFAULT NULL,
    p_side_effects TEXT DEFAULT NULL,
    p_interactions TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_prescription_id UUID;
BEGIN
    -- Insert prescription
    INSERT INTO prescriptions (
        clinic_id,
        patient_id,
        medication_name,
        dosage,
        frequency,
        duration,
        instructions,
        refills_remaining,
        refill_quantity,
        pharmacy_notes,
        patient_notes,
        side_effects,
        interactions
    ) VALUES (
        p_clinic_id,
        p_patient_id,
        p_medication_name,
        p_dosage,
        p_frequency,
        p_duration,
        p_instructions,
        p_refills_remaining,
        p_refill_quantity,
        p_pharmacy_notes,
        p_patient_notes,
        p_side_effects,
        p_interactions
    ) RETURNING id INTO v_prescription_id;

    -- Log in history
    INSERT INTO prescription_history (
        prescription_id,
        action,
        action_by,
        notes
    ) VALUES (
        v_prescription_id,
        'Created',
        'System',
        'Prescription created'
    );

    RETURN v_prescription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Prescription Management System for Dental Clinic
-- This schema creates tables and functions for managing patient prescriptions

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT,
    prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    prescribed_by VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Discontinued', 'On Hold')),
    refills_remaining INTEGER DEFAULT 0,
    refill_quantity VARCHAR(100),
    pharmacy_notes TEXT,
    patient_notes TEXT,
    side_effects TEXT,
    interactions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescription history table for tracking changes
CREATE TABLE IF NOT EXISTS prescription_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'Created', 'Updated', 'Refilled', 'Discontinued', 'Status Changed'
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_by VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_date ON prescriptions(prescribed_date);
CREATE INDEX IF NOT EXISTS idx_prescription_history_prescription_id ON prescription_history(prescription_id);

-- Function to get active prescriptions for a patient
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

-- Function to create a prescription with history tracking
CREATE OR REPLACE FUNCTION create_prescription_with_history(
    p_clinic_id UUID,
    p_patient_id UUID,
    p_medication_name VARCHAR(255),
    p_dosage VARCHAR(100),
    p_frequency VARCHAR(100),
    p_duration VARCHAR(100),
    p_instructions TEXT,
    p_prescribed_by VARCHAR(255),
    p_refills_remaining INTEGER DEFAULT 0,
    p_refill_quantity VARCHAR(100),
    p_pharmacy_notes TEXT,
    p_patient_notes TEXT,
    p_side_effects TEXT,
    p_interactions TEXT
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
        prescribed_by,
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
        p_prescribed_by,
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
        p_prescribed_by,
        'Prescription created'
    );

    RETURN v_prescription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refill a prescription
CREATE OR REPLACE FUNCTION refill_prescription(
    p_prescription_id UUID,
    p_action_by VARCHAR(255),
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_refills INTEGER;
BEGIN
    -- Get current refills
    SELECT refills_remaining INTO v_current_refills
    FROM prescriptions
    WHERE id = p_prescription_id;

    -- Check if refills are available
    IF v_current_refills <= 0 THEN
        RAISE EXCEPTION 'No refills remaining for this prescription';
    END IF;

    -- Decrement refills
    UPDATE prescriptions
    SET refills_remaining = refills_remaining - 1,
        updated_at = NOW()
    WHERE id = p_prescription_id;

    -- Log refill in history
    INSERT INTO prescription_history (
        prescription_id,
        action,
        action_by,
        notes
    ) VALUES (
        p_prescription_id,
        'Refilled',
        p_action_by,
        COALESCE(p_notes, 'Prescription refilled')
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update prescription status
CREATE OR REPLACE FUNCTION update_prescription_status(
    p_prescription_id UUID,
    p_new_status VARCHAR(50),
    p_action_by VARCHAR(255),
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update status
    UPDATE prescriptions
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_prescription_id;

    -- Log status change in history
    INSERT INTO prescription_history (
        prescription_id,
        action,
        action_by,
        notes
    ) VALUES (
        p_prescription_id,
        'Status Changed',
        p_action_by,
        COALESCE(p_notes, 'Status changed to ' || p_new_status)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prescriptions
CREATE POLICY "Users can view prescriptions for their clinic" ON prescriptions
    FOR SELECT USING (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

CREATE POLICY "Users can insert prescriptions for their clinic" ON prescriptions
    FOR INSERT WITH CHECK (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

CREATE POLICY "Users can update prescriptions for their clinic" ON prescriptions
    FOR UPDATE USING (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

CREATE POLICY "Users can delete prescriptions for their clinic" ON prescriptions
    FOR DELETE USING (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

-- Create RLS policies for prescription_history
CREATE POLICY "Users can view prescription history for their clinic" ON prescription_history
    FOR SELECT USING (prescription_id IN (
        SELECT id FROM prescriptions WHERE clinic_id IN (
            SELECT id FROM clinics WHERE id = clinic_id
        )
    ));

CREATE POLICY "Users can insert prescription history for their clinic" ON prescription_history
    FOR INSERT WITH CHECK (prescription_id IN (
        SELECT id FROM prescriptions WHERE clinic_id IN (
            SELECT id FROM clinics WHERE id = clinic_id
        )
    ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prescriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_prescriptions_updated_at();

-- Insert sample prescription data for testing
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
-- Sample prescription for testing (replace with actual clinic_id and patient_id)
(
    'c1ca557d-ca85-4905-beb7-c3985692d463', -- Replace with your clinic_id
    (SELECT id FROM patients WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463' LIMIT 1), -- Replace with actual patient_id
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
    'c1ca557d-ca85-4905-beb7-c3985692d463', -- Replace with your clinic_id
    (SELECT id FROM patients WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463' LIMIT 1), -- Replace with actual patient_id
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

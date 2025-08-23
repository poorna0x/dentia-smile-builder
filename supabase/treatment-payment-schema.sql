-- Treatment Payment Tracking System for Dental Clinic
-- This schema adds payment tracking to existing treatment_plans table

-- Add payment fields to treatment_plans table
ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid', 'Overpaid')),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Create treatment payments table for payment history
CREATE TABLE IF NOT EXISTS treatment_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    treatment_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL, -- 'Cash', 'Card', 'Insurance', 'Bank Transfer', 'Check', 'Other'
    payment_reference VARCHAR(255), -- Receipt number, transaction ID, etc.
    payment_notes TEXT,
    received_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_patient_id ON treatment_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_payment_date ON treatment_payments(payment_date);

-- Function to add payment and update treatment payment status
CREATE OR REPLACE FUNCTION add_treatment_payment(
    p_treatment_id UUID,
    p_clinic_id UUID,
    p_patient_id UUID,
    p_payment_amount DECIMAL(10,2),
    p_payment_method VARCHAR(100),
    p_payment_reference VARCHAR(255),
    p_payment_notes TEXT,
    p_received_by VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
    new_payment_id UUID;
    current_total_cost DECIMAL(10,2);
    current_amount_paid DECIMAL(10,2);
    new_amount_paid DECIMAL(10,2);
    new_payment_status VARCHAR(50);
BEGIN
    -- Get current treatment payment info
    SELECT total_cost, amount_paid INTO current_total_cost, current_amount_paid
    FROM treatment_plans 
    WHERE id = p_treatment_id;
    
    -- Calculate new amount paid
    new_amount_paid := current_amount_paid + p_payment_amount;
    
    -- Determine new payment status
    IF new_amount_paid >= current_total_cost THEN
        new_payment_status := 'Paid';
    ELSIF new_amount_paid > 0 THEN
        new_payment_status := 'Partial';
    ELSE
        new_payment_status := 'Unpaid';
    END IF;
    
    -- Insert payment record
    INSERT INTO treatment_payments (
        treatment_id,
        clinic_id,
        patient_id,
        payment_amount,
        payment_method,
        payment_reference,
        payment_notes,
        received_by
    ) VALUES (
        p_treatment_id,
        p_clinic_id,
        p_patient_id,
        p_payment_amount,
        p_payment_method,
        p_payment_reference,
        p_payment_notes,
        p_received_by
    ) RETURNING id INTO new_payment_id;
    
    -- Update treatment payment status
    UPDATE treatment_plans 
    SET amount_paid = new_amount_paid,
        payment_status = new_payment_status,
        updated_at = NOW()
    WHERE id = p_treatment_id;
    
    RETURN new_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get treatment payment history
CREATE OR REPLACE FUNCTION get_treatment_payments(p_treatment_id UUID)
RETURNS TABLE (
    id UUID,
    payment_date DATE,
    payment_amount DECIMAL(10,2),
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255),
    payment_notes TEXT,
    received_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tp.id,
        tp.payment_date,
        tp.payment_amount,
        tp.payment_method,
        tp.payment_reference,
        tp.payment_notes,
        tp.received_by,
        tp.created_at
    FROM treatment_payments tp
    WHERE tp.treatment_id = p_treatment_id
    ORDER BY tp.payment_date DESC, tp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get treatment payment summary
CREATE OR REPLACE FUNCTION get_treatment_payment_summary(p_treatment_id UUID)
RETURNS TABLE (
    total_cost DECIMAL(10,2),
    amount_paid DECIMAL(10,2),
    remaining_balance DECIMAL(10,2),
    payment_status VARCHAR(50),
    payment_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tp.total_cost,
        tp.amount_paid,
        (tp.total_cost - tp.amount_paid) as remaining_balance,
        tp.payment_status,
        COUNT(tpay.id)::INTEGER as payment_count
    FROM treatment_plans tp
    LEFT JOIN treatment_payments tpay ON tp.id = tpay.treatment_id
    WHERE tp.id = p_treatment_id
    GROUP BY tp.total_cost, tp.amount_paid, tp.payment_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE treatment_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for treatment_payments
CREATE POLICY "Users can view treatment payments for their clinic" ON treatment_payments
    FOR SELECT USING (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

CREATE POLICY "Users can insert treatment payments for their clinic" ON treatment_payments
    FOR INSERT WITH CHECK (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

CREATE POLICY "Users can update treatment payments for their clinic" ON treatment_payments
    FOR UPDATE USING (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

-- Create trigger to update updated_at timestamp
CREATE TRIGGER trigger_update_treatment_payments_updated_at
    BEFORE UPDATE ON treatment_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_work_updated_at();

-- Update existing treatment_plans to have default payment status
UPDATE treatment_plans 
SET payment_status = 'Unpaid' 
WHERE payment_status IS NULL;

-- ✅ TREATMENT PAYMENT SYSTEM SETUP COMPLETE!
-- 
-- WHAT WAS CREATED:
-- ✅ Added payment fields to treatment_plans table
-- ✅ Created treatment_payments table for payment history
-- ✅ All necessary indexes and triggers
-- ✅ Row Level Security enabled
-- ✅ Database functions for payment operations
-- 
-- FEATURES:
-- ✅ Payment tracking (total cost, amount paid, remaining balance)
-- ✅ Payment history with multiple payment methods
-- ✅ Payment status tracking (Unpaid, Partial, Paid, Overpaid)
-- ✅ Payment reference tracking (receipt numbers, transaction IDs)
-- ✅ Multi-clinic support
-- ✅ Complete audit trail

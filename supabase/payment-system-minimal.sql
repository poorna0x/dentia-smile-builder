-- =====================================================
-- 🦷 MINIMAL PAYMENT SYSTEM
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS treatment_payments CASCADE;

-- Create treatment_payments table
CREATE TABLE treatment_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES dental_treatments(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partial', 'Completed', 'Overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_transactions table
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_payment_id UUID NOT NULL REFERENCES treatment_payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_patient_id ON treatment_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_treatment_payment_id ON payment_transactions(treatment_payment_id);

-- Add RLS policies
ALTER TABLE treatment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can adjust these based on your needs)
CREATE POLICY "Enable read access for authenticated users" ON treatment_payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON treatment_payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON treatment_payments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON payment_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON payment_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON payment_transactions FOR UPDATE USING (auth.role() = 'authenticated');
 
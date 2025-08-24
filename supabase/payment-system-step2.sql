-- =====================================================
-- 🦷 PAYMENT SYSTEM - STEP 2: Create Tables
-- =====================================================

-- Create treatment payments table
CREATE TABLE IF NOT EXISTS treatment_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES dental_treatments(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  payment_status payment_status DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_payment_id UUID NOT NULL REFERENCES treatment_payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_patient_id ON treatment_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_status ON treatment_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(treatment_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date);

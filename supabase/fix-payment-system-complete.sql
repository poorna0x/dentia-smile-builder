-- Complete Payment System Fix
-- This script completely rebuilds the payment system to avoid generated column issues

-- Step 1: Drop existing triggers and functions
DROP TRIGGER IF EXISTS update_treatment_payment_on_transaction_trigger ON payment_transactions;
DROP TRIGGER IF EXISTS update_treatment_payment_status ON treatment_payments;
DROP FUNCTION IF EXISTS update_treatment_payment_on_transaction();
DROP FUNCTION IF EXISTS update_payment_status();

-- Step 2: Drop existing tables (if they exist)
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS treatment_payments CASCADE;

-- Step 3: Recreate payment_status enum
DROP TYPE IF EXISTS payment_status CASCADE;
CREATE TYPE payment_status AS ENUM ('Pending', 'Partial', 'Completed', 'Overdue');

-- Step 4: Create treatment_payments table WITHOUT generated column
CREATE TABLE treatment_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES dental_treatments(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (remaining_amount >= 0),
  payment_status payment_status DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create payment_transactions table
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_payment_id UUID NOT NULL REFERENCES treatment_payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_patient_id ON treatment_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_status ON treatment_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(treatment_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_method ON payment_transactions(payment_method);

-- Step 7: Create improved trigger functions
CREATE OR REPLACE FUNCTION update_treatment_payment_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update treatment payment with new paid amount and recalculate remaining
  UPDATE treatment_payments 
  SET 
    paid_amount = paid_amount + NEW.amount,
    remaining_amount = total_amount - (paid_amount + NEW.amount),
    updated_at = NOW()
  WHERE id = NEW.treatment_payment_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate payment status based on paid_amount vs total_amount
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.payment_status = 'Completed';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.payment_status = 'Partial';
  ELSE
    NEW.payment_status = 'Pending';
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create triggers
CREATE TRIGGER update_treatment_payment_on_transaction_trigger
  AFTER INSERT ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treatment_payment_on_transaction();

CREATE TRIGGER update_treatment_payment_status 
  BEFORE UPDATE ON treatment_payments 
  FOR EACH ROW EXECUTE FUNCTION update_payment_status();

-- Step 9: Create payment summary function
CREATE OR REPLACE FUNCTION get_treatment_payment_summary(treatment_uuid UUID)
RETURNS TABLE (
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  remaining_amount DECIMAL(10,2),
  payment_status payment_status,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.total_amount,
    tp.paid_amount,
    tp.remaining_amount,
    tp.payment_status,
    COUNT(pt.id)::BIGINT as transaction_count
  FROM treatment_payments tp
  LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
  WHERE tp.treatment_id = treatment_uuid
  GROUP BY tp.id, tp.total_amount, tp.paid_amount, tp.remaining_amount, tp.payment_status;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Enable Row Level Security
ALTER TABLE treatment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Step 11: Create permissive RLS policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON treatment_payments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_transactions;

CREATE POLICY "Enable all access for authenticated users" ON treatment_payments
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON payment_transactions
FOR ALL USING (auth.role() = 'authenticated');

-- Step 12: Grant necessary permissions
GRANT ALL ON treatment_payments TO authenticated;
GRANT ALL ON payment_transactions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 13: Create auto-create payment records trigger
CREATE OR REPLACE FUNCTION auto_create_payment_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if payment record already exists
  IF NOT EXISTS (
    SELECT 1 FROM treatment_payments 
    WHERE treatment_id = NEW.id
  ) THEN
    -- Create payment record
    INSERT INTO treatment_payments (
      treatment_id,
      clinic_id,
      patient_id,
      total_amount,
      paid_amount,
      remaining_amount,
      payment_status
    ) VALUES (
      NEW.id,
      NEW.clinic_id,
      NEW.patient_id,
      COALESCE(NEW.cost, 0),
      0,
      COALESCE(NEW.cost, 0),
      'Pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create trigger for auto-creating payment records
DROP TRIGGER IF EXISTS auto_create_payment_record_trigger ON dental_treatments;
CREATE TRIGGER auto_create_payment_record_trigger
  AFTER INSERT ON dental_treatments
  FOR EACH ROW EXECUTE FUNCTION auto_create_payment_record();

-- Step 15: Backfill existing treatments with payment records
INSERT INTO treatment_payments (
  treatment_id,
  clinic_id,
  patient_id,
  total_amount,
  paid_amount,
  remaining_amount,
  payment_status
)
SELECT 
  dt.id,
  dt.clinic_id,
  dt.patient_id,
  COALESCE(dt.cost, 0),
  0,
  COALESCE(dt.cost, 0),
  'Pending'
FROM dental_treatments dt
WHERE NOT EXISTS (
  SELECT 1 FROM treatment_payments tp 
  WHERE tp.treatment_id = dt.id
);

-- Step 16: Verify the setup
SELECT 
  'Treatment payments created' as info,
  COUNT(*) as count
FROM treatment_payments;

SELECT 
  'Payment transactions table ready' as info,
  COUNT(*) as count
FROM payment_transactions;

-- Success message
SELECT 'Payment system completely rebuilt and fixed!' as status;

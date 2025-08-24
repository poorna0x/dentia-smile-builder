-- =====================================================
-- 🦷 PAYMENT SYSTEM FOR DENTAL TREATMENTS (STEP BY STEP)
-- =====================================================

-- Step 1: Create ENUM for payment status (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('Pending', 'Partial', 'Completed', 'Overdue');
    END IF;
END $$;

-- Step 2: Create treatment payments table (only if it doesn't exist)
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

-- Step 3: Create payment transactions table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_payment_id UUID NOT NULL REFERENCES treatment_payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_patient_id ON treatment_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_status ON treatment_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(treatment_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date);

-- Step 5: Create or replace functions
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update payment status based on paid amount
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.payment_status = 'Completed';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.payment_status = 'Partial';
  ELSE
    NEW.payment_status = 'Pending';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_treatment_payment_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the paid amount in treatment_payments
  UPDATE treatment_payments 
  SET paid_amount = paid_amount + NEW.amount
  WHERE id = NEW.treatment_payment_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

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

CREATE OR REPLACE FUNCTION get_overdue_payments(clinic_uuid UUID)
RETURNS TABLE (
  treatment_id UUID,
  patient_name TEXT,
  treatment_type TEXT,
  total_amount DECIMAL(10,2),
  remaining_amount DECIMAL(10,2),
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.treatment_id,
    CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as patient_name,
    dt.treatment_type,
    tp.total_amount,
    tp.remaining_amount,
    EXTRACT(DAY FROM NOW() - dt.treatment_date)::INTEGER as days_overdue
  FROM treatment_payments tp
  JOIN dental_treatments dt ON tp.treatment_id = dt.id
  JOIN patients p ON tp.patient_id = p.id
  WHERE tp.clinic_id = clinic_uuid
    AND tp.payment_status IN ('Pending', 'Partial')
    AND tp.remaining_amount > 0
    AND dt.treatment_date < CURRENT_DATE - INTERVAL '30 days'
  ORDER BY dt.treatment_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_treatment_payment_status ON treatment_payments;
CREATE TRIGGER update_treatment_payment_status 
  BEFORE UPDATE ON treatment_payments 
  FOR EACH ROW EXECUTE FUNCTION update_payment_status();

DROP TRIGGER IF EXISTS update_treatment_payment_on_transaction_trigger ON payment_transactions;
CREATE TRIGGER update_treatment_payment_on_transaction_trigger
  AFTER INSERT ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treatment_payment_on_transaction();

-- Fix treatment_payments 406 error
-- This script will ensure the treatment_payments table exists and has proper permissions

-- 1. Check if treatment_payments table exists
SELECT 
  'treatment_payments table check' as step,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'treatment_payments' 
    AND table_schema = 'public'
  ) as table_exists;

-- 2. Create treatment_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS treatment_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES dental_treatments(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_patient_id ON treatment_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_status ON treatment_payments(payment_status);

-- 4. Create payment_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_payment_id UUID NOT NULL REFERENCES treatment_payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(treatment_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(payment_method);

-- 6. Enable RLS on both tables
ALTER TABLE treatment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all treatment payments" ON treatment_payments;
DROP POLICY IF EXISTS "Allow all payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON treatment_payments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_transactions;
DROP POLICY IF EXISTS "Enable all access for anon users" ON treatment_payments;
DROP POLICY IF EXISTS "Enable all access for anon users" ON payment_transactions;

-- 8. Create simple policies that allow all access
CREATE POLICY "Allow all treatment payments" ON treatment_payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all payment transactions" ON payment_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- 9. Grant permissions
GRANT ALL ON treatment_payments TO authenticated;
GRANT ALL ON treatment_payments TO anon;
GRANT ALL ON payment_transactions TO authenticated;
GRANT ALL ON payment_transactions TO anon;

-- 10. Create function to update remaining amount
CREATE OR REPLACE FUNCTION update_treatment_payment_remaining()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the remaining amount in treatment_payments
  UPDATE treatment_payments
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM payment_transactions
      WHERE treatment_payment_id = NEW.treatment_payment_id
    ),
    remaining_amount = total_amount - (
      SELECT COALESCE(SUM(amount), 0)
      FROM payment_transactions
      WHERE treatment_payment_id = NEW.treatment_payment_id
    ),
    payment_status = CASE
      WHEN total_amount = 0 THEN 'completed'
      WHEN total_amount <= (
        SELECT COALESCE(SUM(amount), 0)
        FROM payment_transactions
        WHERE treatment_payment_id = NEW.treatment_payment_id
      ) THEN 'completed'
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM payment_transactions
        WHERE treatment_payment_id = NEW.treatment_payment_id
      ) > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = NEW.treatment_payment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for payment_transactions
DROP TRIGGER IF EXISTS update_treatment_payment_status ON payment_transactions;
CREATE TRIGGER update_treatment_payment_status
  AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treatment_payment_remaining();

-- 12. Test the tables
SELECT 
  'treatment_payments test' as test_name,
  COUNT(*) as record_count
FROM treatment_payments;

SELECT 
  'payment_transactions test' as test_name,
  COUNT(*) as record_count
FROM payment_transactions;

-- 13. Show table structure
SELECT 
  'treatment_payments structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'treatment_payments'
ORDER BY ordinal_position;

SELECT 
  'payment_transactions structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions'
ORDER BY ordinal_position;

-- =====================================================
-- 💰 FINAL PAYMENT SYSTEM SETUP
-- =====================================================

-- Step 1: Drop existing payment tables to start fresh
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS treatment_payments CASCADE;

-- Step 2: Create payment tables with correct structure
CREATE TABLE treatment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partial', 'Completed', 'Overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_payment_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Insurance', 'Other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);
CREATE INDEX idx_treatment_payments_patient_id ON treatment_payments(patient_id);
CREATE INDEX idx_payment_transactions_treatment_payment_id ON payment_transactions(treatment_payment_id);
CREATE INDEX idx_payment_transactions_payment_date ON payment_transactions(payment_date);

-- Step 4: Disable RLS completely
ALTER TABLE treatment_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant all permissions
GRANT ALL PRIVILEGES ON treatment_payments TO authenticated;
GRANT ALL PRIVILEGES ON payment_transactions TO authenticated;
GRANT ALL PRIVILEGES ON treatment_payments TO anon;
GRANT ALL PRIVILEGES ON payment_transactions TO anon;
GRANT ALL PRIVILEGES ON treatment_payments TO service_role;
GRANT ALL PRIVILEGES ON payment_transactions TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- Step 6: Create trigger to update payment status when transactions are added
CREATE OR REPLACE FUNCTION update_payment_status_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(10,2);
  payment_record RECORD;
BEGIN
  -- Get the treatment payment record
  SELECT * INTO payment_record FROM treatment_payments WHERE id = NEW.treatment_payment_id;
  
  -- Calculate total paid amount
  SELECT COALESCE(SUM(amount), 0) INTO total_paid 
  FROM payment_transactions 
  WHERE treatment_payment_id = NEW.treatment_payment_id;
  
  -- Update payment status
  UPDATE treatment_payments 
  SET 
    paid_amount = total_paid,
    payment_status = CASE 
      WHEN total_paid = 0 THEN 'Pending'
      WHEN total_paid >= payment_record.total_amount THEN 'Completed'
      ELSE 'Partial'
    END,
    updated_at = NOW()
  WHERE id = NEW.treatment_payment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status updates
DROP TRIGGER IF EXISTS update_payment_status_trigger ON payment_transactions;
CREATE TRIGGER update_payment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_status_on_transaction();

-- Step 7: Create test data
DO $$
DECLARE
  clinic_uuid UUID;
  patient_uuid UUID;
  treatment_uuid UUID;
  payment_uuid UUID;
BEGIN
  -- Get a clinic
  SELECT id INTO clinic_uuid FROM clinics LIMIT 1;
  
  -- Get a patient
  SELECT id INTO patient_uuid FROM patients WHERE clinic_id = clinic_uuid LIMIT 1;
  
  -- Get a treatment
  SELECT id INTO treatment_uuid FROM dental_treatments WHERE clinic_id = clinic_uuid LIMIT 1;
  
  -- Create test payment if we have required data
  IF clinic_uuid IS NOT NULL AND patient_uuid IS NOT NULL AND treatment_uuid IS NOT NULL THEN
    -- Create a test payment
    INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
    VALUES (treatment_uuid, clinic_uuid, patient_uuid, 5000.00, 0.00, 'Pending')
    RETURNING id INTO payment_uuid;
    
    -- Create a test transaction
    INSERT INTO payment_transactions (treatment_payment_id, amount, payment_date, payment_method, notes)
    VALUES (payment_uuid, 2500.00, CURRENT_DATE, 'Cash', 'Test payment from final setup');
    
    RAISE NOTICE 'Test data created successfully. Payment ID: %, Treatment ID: %', payment_uuid, treatment_uuid;
  ELSE
    RAISE NOTICE 'Could not create test data - missing clinic, patient, or treatment';
  END IF;
END $$;

-- Step 8: Verify setup
SELECT 'VERIFICATION RESULTS:' as info;

SELECT 'Treatment payments table:' as table_name, COUNT(*) as count FROM treatment_payments
UNION ALL
SELECT 'Payment transactions table:' as table_name, COUNT(*) as count FROM payment_transactions;

SELECT 'Sample treatment payment:' as info;
SELECT 
  id,
  treatment_id,
  clinic_id,
  patient_id,
  total_amount,
  paid_amount,
  remaining_amount,
  payment_status
FROM treatment_payments 
LIMIT 1;

SELECT 'Sample payment transaction:' as info;
SELECT 
  id,
  treatment_payment_id,
  amount,
  payment_date,
  payment_method,
  notes
FROM payment_transactions 
LIMIT 1;

-- Success message
SELECT 'Final payment system setup completed! Payment system should now work correctly.' as status;

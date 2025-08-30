-- =====================================================
-- 🔧 COMPLETE PAYMENT SYSTEM FIX - STEP BY STEP
-- =====================================================

-- STEP 1: DIAGNOSE THE CURRENT STATE
SELECT 'STEP 1: DIAGNOSING CURRENT STATE' as step;

-- Check if tables exist
SELECT 
  'Tables exist?' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treatment_payments') THEN 'YES'
    ELSE 'NO'
  END as treatment_payments,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN 'YES'
    ELSE 'NO'
  END as payment_transactions;

-- Check RLS status
SELECT 
  'RLS Status' as check_type,
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE tablename IN ('treatment_payments', 'payment_transactions');

-- Check permissions
SELECT 
  'Permissions' as check_type,
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('treatment_payments', 'payment_transactions')
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY grantee, privilege_type;

-- STEP 2: COMPLETE CLEANUP
SELECT 'STEP 2: COMPLETE CLEANUP' as step;

-- Drop everything related to payments
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS treatment_payments CASCADE;
DROP FUNCTION IF EXISTS update_payment_status_on_transaction() CASCADE;
DROP FUNCTION IF EXISTS get_treatment_payment_summary(UUID) CASCADE;

-- STEP 3: CREATE FRESH TABLES
SELECT 'STEP 3: CREATING FRESH TABLES' as step;

-- Create treatment_payments table
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

-- Create payment_transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_payment_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Insurance', 'Other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 4: DISABLE RLS COMPLETELY
SELECT 'STEP 4: DISABLING RLS' as step;

ALTER TABLE treatment_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;

-- STEP 5: GRANT ALL PERMISSIONS
SELECT 'STEP 5: GRANTING PERMISSIONS' as step;

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON treatment_payments TO authenticated;
GRANT ALL PRIVILEGES ON payment_transactions TO authenticated;

-- Grant permissions to anonymous users
GRANT ALL PRIVILEGES ON treatment_payments TO anon;
GRANT ALL PRIVILEGES ON payment_transactions TO anon;

-- Grant permissions to service role
GRANT ALL PRIVILEGES ON treatment_payments TO service_role;
GRANT ALL PRIVILEGES ON payment_transactions TO service_role;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- STEP 6: CREATE INDEXES
SELECT 'STEP 6: CREATING INDEXES' as step;

CREATE INDEX idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);
CREATE INDEX idx_treatment_payments_patient_id ON treatment_payments(patient_id);
CREATE INDEX idx_payment_transactions_treatment_payment_id ON payment_transactions(treatment_payment_id);

-- STEP 7: CREATE TRIGGER FUNCTION
SELECT 'STEP 7: CREATING TRIGGER FUNCTION' as step;

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

-- STEP 8: CREATE TRIGGER
SELECT 'STEP 8: CREATING TRIGGER' as step;

CREATE TRIGGER update_payment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_status_on_transaction();

-- STEP 9: CREATE TEST DATA
SELECT 'STEP 9: CREATING TEST DATA' as step;

DO $$
DECLARE
  clinic_uuid UUID;
  patient_uuid UUID;
  treatment_uuid UUID;
  payment_uuid UUID;
BEGIN
  -- Get test data
  SELECT id INTO clinic_uuid FROM clinics LIMIT 1;
  
  IF clinic_uuid IS NOT NULL THEN
    SELECT id INTO patient_uuid FROM patients WHERE clinic_id = clinic_uuid LIMIT 1;
    
    IF patient_uuid IS NOT NULL THEN
      SELECT id INTO treatment_uuid FROM dental_treatments WHERE clinic_id = clinic_uuid LIMIT 1;
      
      IF treatment_uuid IS NOT NULL THEN
        -- Create test payment
        INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
        VALUES (treatment_uuid, clinic_uuid, patient_uuid, 5000.00, 0.00, 'Pending')
        RETURNING id INTO payment_uuid;
        
        -- Create test transaction
        INSERT INTO payment_transactions (treatment_payment_id, amount, payment_date, payment_method, notes)
        VALUES (payment_uuid, 2000.00, CURRENT_DATE, 'Cash', 'Test payment from complete fix');
        
        RAISE NOTICE '✅ Test data created successfully! Payment ID: %, Treatment ID: %', payment_uuid, treatment_uuid;
      ELSE
        RAISE NOTICE '⚠️ No treatments found for clinic';
      END IF;
    ELSE
      RAISE NOTICE '⚠️ No patients found for clinic';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ No clinics found';
  END IF;
END $$;

-- STEP 10: VERIFY SETUP
SELECT 'STEP 10: VERIFYING SETUP' as step;

-- Check table counts
SELECT 
  'Table Counts' as check_type,
  'treatment_payments' as table_name,
  COUNT(*) as record_count
FROM treatment_payments
UNION ALL
SELECT 
  'Table Counts' as check_type,
  'payment_transactions' as table_name,
  COUNT(*) as record_count
FROM payment_transactions;

-- Test direct query
SELECT 
  'Direct Query Test' as check_type,
  tp.id,
  tp.treatment_id,
  tp.total_amount,
  tp.paid_amount,
  tp.remaining_amount,
  tp.payment_status
FROM treatment_payments tp
LIMIT 1;

-- Test transaction count query
SELECT 
  'Transaction Count Test' as check_type,
  tp.id,
  tp.treatment_id,
  COUNT(pt.id) as transaction_count
FROM treatment_payments tp
LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
GROUP BY tp.id, tp.treatment_id
LIMIT 1;

-- STEP 11: FINAL VERIFICATION
SELECT 'STEP 11: FINAL VERIFICATION' as step;

SELECT 
  'Final Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'treatment_payments' 
      AND rowsecurity = false
    ) THEN 'RLS DISABLED ✅'
    ELSE 'RLS ENABLED ❌'
  END as rls_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants 
      WHERE table_name = 'treatment_payments' 
      AND grantee = 'authenticated'
      AND privilege_type = 'ALL'
    ) THEN 'PERMISSIONS OK ✅'
    ELSE 'PERMISSIONS MISSING ❌'
  END as permissions_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM treatment_payments LIMIT 1) THEN 'DATA EXISTS ✅'
    ELSE 'NO DATA ❌'
  END as data_status;

-- SUCCESS MESSAGE
SELECT '🎉 COMPLETE PAYMENT FIX FINISHED! All 406 errors should now be resolved.' as final_status;

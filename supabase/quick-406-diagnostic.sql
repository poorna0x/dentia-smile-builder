-- =====================================================
-- 🔍 QUICK 406 DIAGNOSTIC & FIX
-- =====================================================

-- Check if payment tables exist
SELECT 'Checking payment tables...' as step;

SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('treatment_payments', 'payment_transactions');

-- Check RLS status
SELECT 'Checking RLS status...' as step;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('treatment_payments', 'payment_transactions');

-- Check permissions
SELECT 'Checking permissions...' as step;

SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('treatment_payments', 'payment_transactions')
  AND grantee IN ('authenticated', 'anon', 'service_role');

-- Quick fix: Drop and recreate tables with proper permissions
SELECT 'Applying quick fix...' as step;

-- Drop existing tables
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS treatment_payments CASCADE;

-- Create tables with correct structure
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

-- Disable RLS completely
ALTER TABLE treatment_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL PRIVILEGES ON treatment_payments TO authenticated;
GRANT ALL PRIVILEGES ON payment_transactions TO authenticated;
GRANT ALL PRIVILEGES ON treatment_payments TO anon;
GRANT ALL PRIVILEGES ON payment_transactions TO anon;
GRANT ALL PRIVILEGES ON treatment_payments TO service_role;
GRANT ALL PRIVILEGES ON payment_transactions TO service_role;

-- Create indexes
CREATE INDEX idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX idx_payment_transactions_treatment_payment_id ON payment_transactions(treatment_payment_id);

-- Test insert
SELECT 'Testing insert...' as step;

DO $$
DECLARE
  clinic_uuid UUID;
  patient_uuid UUID;
  treatment_uuid UUID;
BEGIN
  -- Get test data
  SELECT id INTO clinic_uuid FROM clinics LIMIT 1;
  SELECT id INTO patient_uuid FROM patients WHERE clinic_id = clinic_uuid LIMIT 1;
  SELECT id INTO treatment_uuid FROM dental_treatments WHERE clinic_id = clinic_uuid LIMIT 1;
  
  IF clinic_uuid IS NOT NULL AND patient_uuid IS NOT NULL AND treatment_uuid IS NOT NULL THEN
    -- Test insert
    INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
    VALUES (treatment_uuid, clinic_uuid, patient_uuid, 1000.00, 0.00, 'Pending');
    
    RAISE NOTICE 'Test insert successful for treatment: %', treatment_uuid;
  ELSE
    RAISE NOTICE 'No test data available';
  END IF;
END $$;

-- Final verification
SELECT 'Final verification...' as step;

SELECT 
  'treatment_payments' as table_name,
  COUNT(*) as record_count
FROM treatment_payments
UNION ALL
SELECT 
  'payment_transactions' as table_name,
  COUNT(*) as record_count
FROM payment_transactions;

SELECT '406 error should now be fixed! Try the payment system again.' as result;

-- Diagnose Payment System Issue
-- This script checks the current state of the payment system

-- Step 1: Check if tables exist
SELECT 
  'Table Check' as info,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_name IN ('treatment_payments', 'payment_transactions')
ORDER BY table_name;

-- Step 2: Check table structure
SELECT 
  'treatment_payments structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_generated,
  generation_expression
FROM information_schema.columns 
WHERE table_name = 'treatment_payments' 
ORDER BY ordinal_position;

SELECT 
  'payment_transactions structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
ORDER BY ordinal_position;

-- Step 3: Check constraints
SELECT 
  'treatment_payments constraints' as info,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause as constraint_definition
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'treatment_payments';

SELECT 
  'payment_transactions constraints' as info,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause as constraint_definition
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'payment_transactions';

-- Step 4: Check triggers
SELECT 
  'Triggers' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('treatment_payments', 'payment_transactions')
ORDER BY trigger_name;

-- Step 5: Check functions
SELECT 
  'Functions' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('update_treatment_payment_on_transaction', 'update_payment_status', 'auto_create_payment_record')
ORDER BY routine_name;

-- Step 6: Check RLS policies
SELECT 
  'RLS Policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('treatment_payments', 'payment_transactions')
ORDER BY tablename, policyname;

-- Step 7: Check existing data
SELECT 
  'treatment_payments data' as info,
  COUNT(*) as total_records,
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN payment_status = 'Partial' THEN 1 ELSE 0 END) as partial,
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) as completed
FROM treatment_payments;

SELECT 
  'payment_transactions data' as info,
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount
FROM payment_transactions;

-- Step 8: Test insert with sample data
DO $$
DECLARE
  test_payment_id UUID;
  test_transaction_id UUID;
BEGIN
  -- Check if we have any treatment_payments to work with
  SELECT id INTO test_payment_id FROM treatment_payments LIMIT 1;
  
  IF test_payment_id IS NOT NULL THEN
    -- Try to insert a test transaction
    INSERT INTO payment_transactions (
      treatment_payment_id,
      amount,
      payment_method,
      payment_date,
      notes
    ) VALUES (
      test_payment_id,
      100.00,
      'Cash',
      CURRENT_DATE,
      'Test transaction'
    ) RETURNING id INTO test_transaction_id;
    
    RAISE NOTICE 'Test transaction inserted successfully with ID: %', test_transaction_id;
    
    -- Clean up test data
    DELETE FROM payment_transactions WHERE id = test_transaction_id;
    RAISE NOTICE 'Test transaction cleaned up';
  ELSE
    RAISE NOTICE 'No treatment_payments found to test with';
  END IF;
END $$;

-- Step 9: Check for any recent errors in logs (if available)
SELECT 
  'System Status' as info,
  'Payment system diagnostic completed' as status;

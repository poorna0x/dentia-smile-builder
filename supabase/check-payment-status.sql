-- =====================================================
-- 🔍 PAYMENT SYSTEM DIAGNOSTIC
-- =====================================================

-- Check if payment tables exist
SELECT '1. Checking if payment tables exist...' as step;

SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('treatment_payments', 'payment_transactions');

-- Check table structure
SELECT '2. Checking table structure...' as step;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'treatment_payments'
ORDER BY ordinal_position;

-- Check RLS status
SELECT '3. Checking RLS status...' as step;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('treatment_payments', 'payment_transactions');

-- Check permissions
SELECT '4. Checking permissions...' as step;

SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('treatment_payments', 'payment_transactions')
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY grantee, privilege_type;

-- Check if there's any data
SELECT '5. Checking for data...' as step;

SELECT 
  'treatment_payments' as table_name,
  COUNT(*) as record_count
FROM treatment_payments
UNION ALL
SELECT 
  'payment_transactions' as table_name,
  COUNT(*) as record_count
FROM payment_transactions;

-- Test a direct query
SELECT '6. Testing direct query...' as step;

SELECT 
  tp.id,
  tp.treatment_id,
  tp.total_amount,
  tp.paid_amount,
  tp.payment_status
FROM treatment_payments tp
LIMIT 5;

-- Check for any RLS policies
SELECT '7. Checking RLS policies...' as step;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('treatment_payments', 'payment_transactions');

-- Final status
SELECT '8. DIAGNOSTIC COMPLETE' as step;

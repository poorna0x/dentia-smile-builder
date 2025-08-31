-- Test script to check payment tables status
-- Run this in Supabase SQL editor

-- 1. Check if tables exist
SELECT 
  'treatment_payments' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'treatment_payments' 
    AND table_schema = 'public'
  ) as exists
UNION ALL
SELECT 
  'payment_transactions' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'payment_transactions' 
    AND table_schema = 'public'
  ) as exists;

-- 2. Check table structure
SELECT 
  'treatment_payments structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'treatment_payments'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('treatment_payments', 'payment_transactions');

-- 4. Check policies
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

-- 5. Test basic access
SELECT 
  'treatment_payments test' as test_name,
  COUNT(*) as record_count
FROM treatment_payments;

SELECT 
  'payment_transactions test' as test_name,
  COUNT(*) as record_count
FROM payment_transactions;

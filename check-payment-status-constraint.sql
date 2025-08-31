-- Check payment status constraint
-- Run this in Supabase SQL editor

-- 1. Check the constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'treatment_payments'::regclass 
  AND conname = 'treatment_payments_payment_status_check';

-- 2. Check what payment status values currently exist
SELECT 
  payment_status,
  COUNT(*) as count
FROM treatment_payments 
GROUP BY payment_status;

-- 3. Check if there are any existing records
SELECT 
  'Existing records' as info,
  COUNT(*) as total_records
FROM treatment_payments;

-- 4. Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'treatment_payments' 
  AND column_name = 'payment_status';

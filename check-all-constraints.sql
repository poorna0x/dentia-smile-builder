-- Check all constraints on treatment_payments table
-- Run this in Supabase SQL editor

-- 1. Check all constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'treatment_payments'::regclass;

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'treatment_payments'
ORDER BY ordinal_position;

-- 3. Check if there are any existing records
SELECT 
  'Existing records' as info,
  COUNT(*) as total_records,
  MIN(total_amount) as min_total_amount,
  MAX(total_amount) as max_total_amount
FROM treatment_payments;

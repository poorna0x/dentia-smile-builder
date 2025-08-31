-- Check treatment_payments table specifically
-- Run this in Supabase SQL editor

-- 1. Check treatment_payments table
SELECT 
  'treatment_payments test' as test_name,
  COUNT(*) as record_count
FROM treatment_payments;

-- 2. Check a specific treatment payment
SELECT 
  id,
  treatment_id,
  clinic_id,
  patient_id,
  total_amount,
  paid_amount,
  remaining_amount,
  payment_status,
  created_at
FROM treatment_payments 
LIMIT 5;

-- 3. Check if there are any treatments without payment records
SELECT 
  'treatments without payments' as info,
  COUNT(*) as count
FROM dental_treatments dt
LEFT JOIN treatment_payments tp ON dt.id = tp.treatment_id
WHERE tp.id IS NULL;

-- 4. Check the specific treatment that's causing the 406 error
SELECT 
  'specific treatment check' as info,
  dt.id as treatment_id,
  dt.treatment_type,
  dt.created_at,
  tp.id as payment_id,
  tp.payment_status
FROM dental_treatments dt
LEFT JOIN treatment_payments tp ON dt.id = tp.treatment_id
WHERE dt.id = '2e4d2c68-835d-4bff-85b0-c15180c59cc1';

-- 5. Test the exact query that's failing
SELECT 
  'exact query test' as info,
  tp.*
FROM treatment_payments tp
WHERE tp.treatment_id = '2e4d2c68-835d-4bff-85b0-c15180c59cc1';

-- Fix the specific payment record to have 0 total_amount
-- Run this in Supabase SQL editor

-- 1. Update the specific payment record
UPDATE treatment_payments 
SET total_amount = 0 
WHERE treatment_id = '2e4d2c68-835d-4bff-85b0-c15180c59cc1';

-- 2. Check the result
SELECT 
  'Updated payment' as info,
  tp.*
FROM treatment_payments tp
WHERE tp.treatment_id = '2e4d2c68-835d-4bff-85b0-c15180c59cc1';

-- 3. Update all other payment records that have 1.00 total_amount
UPDATE treatment_payments 
SET total_amount = 0 
WHERE total_amount = 1.00;

-- 4. Show all payment records
SELECT 
  'All payments' as info,
  treatment_id,
  total_amount,
  paid_amount,
  remaining_amount,
  payment_status
FROM treatment_payments 
ORDER BY created_at;

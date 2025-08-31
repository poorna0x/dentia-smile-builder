-- Fix existing payment records to have 0 total_amount
-- Run this in Supabase SQL editor

-- 1. Update existing payment records to have 0 total_amount
UPDATE treatment_payments 
SET total_amount = 0 
WHERE total_amount = 1.00;

-- 2. Check the results
SELECT 
  'Updated payments' as info,
  COUNT(*) as updated_count
FROM treatment_payments 
WHERE total_amount = 0;

-- 3. Show current payment amounts
SELECT 
  'Current amounts' as info,
  total_amount,
  paid_amount,
  remaining_amount,
  payment_status,
  COUNT(*) as count
FROM treatment_payments 
GROUP BY total_amount, paid_amount, remaining_amount, payment_status
ORDER BY total_amount;

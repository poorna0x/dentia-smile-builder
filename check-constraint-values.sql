-- Check what values the payment_status constraint allows
-- Run this in Supabase SQL editor

-- 1. Check the constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'treatment_payments'::regclass 
  AND conname = 'treatment_payments_payment_status_check';

-- 2. Try to insert with different values to see which ones work
-- (This will help us understand what the constraint allows)

-- Test with 'Pending'
INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 0, 0, 'Pending')
ON CONFLICT DO NOTHING;

-- Test with 'pending'
INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 0, 0, 'pending')
ON CONFLICT DO NOTHING;

-- Test with 'PENDING'
INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 0, 0, 'PENDING')
ON CONFLICT DO NOTHING;

-- 3. Show current payment status values
SELECT 
  payment_status,
  COUNT(*) as count
FROM treatment_payments 
GROUP BY payment_status;

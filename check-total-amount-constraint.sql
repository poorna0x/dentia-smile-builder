-- Check the total_amount constraint
-- Run this in Supabase SQL editor

-- 1. Check the constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'treatment_payments'::regclass 
  AND conname = 'treatment_payments_total_amount_check';

-- 2. Try to drop the problematic constraint
ALTER TABLE treatment_payments 
DROP CONSTRAINT IF EXISTS treatment_payments_total_amount_check;

-- 3. Add a more reasonable constraint (allow 0 and positive values)
ALTER TABLE treatment_payments 
ADD CONSTRAINT treatment_payments_total_amount_check 
CHECK (total_amount >= 0);

-- 4. Test inserting with 0
INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 0, 0, 'Pending')
ON CONFLICT DO NOTHING;

-- 5. Show current constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'treatment_payments'::regclass;

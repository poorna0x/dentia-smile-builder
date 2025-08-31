-- Create missing payment record for the specific treatment
-- Run this in Supabase SQL editor

-- 1. First, let's see what the treatment looks like
SELECT 
  id,
  treatment_type,
  clinic_id,
  patient_id,
  created_at
FROM dental_treatments 
WHERE id = '2e4d2c68-835d-4bff-85b0-c15180c59cc1';

-- 2. Try to create a payment record with minimal data
INSERT INTO treatment_payments (
  treatment_id,
  clinic_id,
  patient_id
) 
SELECT 
  id,
  clinic_id,
  patient_id
FROM dental_treatments 
WHERE id = '2e4d2c68-835d-4bff-85b0-c15180c59cc1'
ON CONFLICT (treatment_id) DO NOTHING;

-- 3. Check if it was created
SELECT 
  'Payment record created' as info,
  tp.*
FROM treatment_payments tp
WHERE tp.treatment_id = '2e4d2c68-835d-4bff-85b0-c15180c59cc1';

-- 4. Test the exact query that was failing
SELECT 
  'Test query' as info,
  tp.*
FROM treatment_payments tp
WHERE tp.treatment_id = '2e4d2c68-835d-4bff-85b0-c15180c59cc1';

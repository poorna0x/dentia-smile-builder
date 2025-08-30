-- =====================================================
-- 🔍 VERIFY PAYMENT DATA - CHECK WHY UI ISN'T SHOWING IT
-- =====================================================

-- Check if we have any treatment payments
SELECT 'TREATMENT PAYMENTS:' as info;
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
ORDER BY created_at DESC 
LIMIT 5;

-- Check if we have any payment transactions
SELECT 'PAYMENT TRANSACTIONS:' as info;
SELECT 
  id,
  treatment_payment_id,
  amount,
  payment_date,
  payment_method,
  notes,
  created_at
FROM payment_transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- Test the payment summary function with a specific treatment
SELECT 'TESTING PAYMENT SUMMARY FUNCTION:' as info;
SELECT 
  treatment_id,
  total_amount,
  paid_amount,
  remaining_amount,
  payment_status,
  transaction_count
FROM get_treatment_payment_summary(
  (SELECT treatment_id FROM treatment_payments LIMIT 1)
);

-- Check if there are any treatments without payment records
SELECT 'TREATMENTS WITHOUT PAYMENT RECORDS:' as info;
SELECT 
  dt.id as treatment_id,
  dt.treatment_type,
  dt.clinic_id
FROM dental_treatments dt
LEFT JOIN treatment_payments tp ON dt.id = tp.treatment_id
WHERE tp.id IS NULL
LIMIT 5;

-- Check if there are any orphaned payment records
SELECT 'ORPHANED PAYMENT RECORDS:' as info;
SELECT 
  tp.id as payment_id,
  tp.treatment_id,
  tp.total_amount,
  tp.paid_amount
FROM treatment_payments tp
LEFT JOIN dental_treatments dt ON tp.treatment_id = dt.id
WHERE dt.id IS NULL;

-- Check the relationship between treatments and payments
SELECT 'TREATMENT-PAYMENT RELATIONSHIP:' as info;
SELECT 
  dt.id as treatment_id,
  dt.treatment_type,
  tp.id as payment_id,
  tp.total_amount,
  tp.paid_amount,
  tp.payment_status,
  COUNT(pt.id) as transaction_count
FROM dental_treatments dt
LEFT JOIN treatment_payments tp ON dt.id = tp.treatment_id
LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
GROUP BY dt.id, dt.treatment_type, tp.id, tp.total_amount, tp.paid_amount, tp.payment_status
ORDER BY dt.id
LIMIT 10;

-- Success message
SELECT 'Payment data verification completed!' as status;

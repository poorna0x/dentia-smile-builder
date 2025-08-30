-- =====================================================
-- 🔍 DEBUG PAYMENT ISSUE - CHECK WHAT'S HAPPENING
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
LIMIT 10;

-- Check if treatment_payment_id in transactions matches treatment_payments.id
SELECT 'CHECKING RELATIONSHIPS:' as info;
SELECT 
  pt.id as transaction_id,
  pt.treatment_payment_id,
  tp.id as payment_id,
  pt.amount,
  pt.payment_method,
  tp.paid_amount,
  tp.payment_status
FROM payment_transactions pt
LEFT JOIN treatment_payments tp ON pt.treatment_payment_id = tp.id
ORDER BY pt.created_at DESC 
LIMIT 10;

-- Check if there are any orphaned transactions (no matching treatment_payment)
SELECT 'ORPHANED TRANSACTIONS:' as info;
SELECT 
  pt.id,
  pt.treatment_payment_id,
  pt.amount,
  pt.payment_method
FROM payment_transactions pt
LEFT JOIN treatment_payments tp ON pt.treatment_payment_id = tp.id
WHERE tp.id IS NULL;

-- Check if there are any treatment payments with wrong paid_amount
SELECT 'PAYMENT AMOUNT MISMATCH:' as info;
WITH transaction_totals AS (
  SELECT 
    treatment_payment_id,
    SUM(amount) as total_transactions
  FROM payment_transactions
  GROUP BY treatment_payment_id
)
SELECT 
  tp.id,
  tp.paid_amount as stored_paid_amount,
  COALESCE(tt.total_transactions, 0) as calculated_paid_amount,
  tp.payment_status
FROM treatment_payments tp
LEFT JOIN transaction_totals tt ON tp.id = tt.treatment_payment_id
WHERE tp.paid_amount != COALESCE(tt.total_transactions, 0);

-- Check the trigger function
SELECT 'TRIGGER FUNCTION:' as info;
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_treatment_payment_on_transaction';

-- Success message
SELECT 'Payment debug completed!' as status;

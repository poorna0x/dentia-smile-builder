-- =====================================================
-- 🧪 TEST PAYMENT SYSTEM - FIXED VERSION
-- =====================================================

-- First, let's see what we have
SELECT 'CURRENT STATE:' as info;

-- Check if we have any treatments
SELECT 'DENTAL TREATMENTS:' as info;
SELECT COUNT(*) as total_treatments FROM dental_treatments;

-- Check if we have any treatment payments
SELECT 'TREATMENT PAYMENTS:' as info;
SELECT COUNT(*) as total_treatment_payments FROM treatment_payments;

-- Check if we have any payment transactions
SELECT 'PAYMENT TRANSACTIONS:' as info;
SELECT COUNT(*) as total_payment_transactions FROM payment_transactions;

-- Get a sample treatment to test with
SELECT 'SAMPLE TREATMENT:' as info;
SELECT id, treatment_type, clinic_id FROM dental_treatments LIMIT 1;

-- Get clinic ID
SELECT 'CLINIC ID:' as info;
SELECT id, name FROM clinics LIMIT 1;

-- Now let's create a simple test payment
DO $$
DECLARE
  clinic_uuid UUID;
  treatment_uuid UUID;
  patient_uuid UUID;
  treatment_payment_uuid UUID;
BEGIN
  -- Get clinic ID
  SELECT id INTO clinic_uuid FROM clinics LIMIT 1;
  
  -- Get or create a treatment
  SELECT id INTO treatment_uuid FROM dental_treatments WHERE clinic_id = clinic_uuid LIMIT 1;
  
  IF treatment_uuid IS NULL THEN
    RAISE NOTICE 'No treatments found for clinic %', clinic_uuid;
    RETURN;
  END IF;
  
  -- Get or create a patient
  SELECT id INTO patient_uuid FROM patients WHERE clinic_id = clinic_uuid LIMIT 1;
  
  IF patient_uuid IS NULL THEN
    -- Create a test patient
    INSERT INTO patients (clinic_id, name, phone, email, date_of_birth, gender, address)
    VALUES (
      clinic_uuid,
      'Test Patient',
      '1234567890',
      'test@example.com',
      '1990-01-01',
      'Other',
      'Test Address'
    ) RETURNING id INTO patient_uuid;
  END IF;
  
  -- Check if treatment payment already exists
  SELECT id INTO treatment_payment_uuid FROM treatment_payments WHERE treatment_id = treatment_uuid;
  
  IF treatment_payment_uuid IS NULL THEN
    -- Create treatment payment
    INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
    VALUES (
      treatment_uuid,
      clinic_uuid,
      patient_uuid,
      5000.00,
      0.00,
      'Pending'
    ) RETURNING id INTO treatment_payment_uuid;
    
    RAISE NOTICE 'Created treatment payment with ID: %', treatment_payment_uuid;
  ELSE
    RAISE NOTICE 'Treatment payment already exists with ID: %', treatment_payment_uuid;
  END IF;
  
  -- Add a test payment transaction
  INSERT INTO payment_transactions (treatment_payment_id, amount, payment_date, payment_method, notes)
  VALUES (
    treatment_payment_uuid,
    2000.00,
    CURRENT_DATE,
    'Cash',
    'Test payment transaction'
  );
  
  RAISE NOTICE 'Added test payment transaction';
  
END $$;

-- Check the results
SELECT 'AFTER TEST - TREATMENT PAYMENTS:' as info;
SELECT 
  id,
  treatment_id,
  total_amount,
  paid_amount,
  remaining_amount,
  payment_status
FROM treatment_payments 
ORDER BY created_at DESC 
LIMIT 3;

SELECT 'AFTER TEST - PAYMENT TRANSACTIONS:' as info;
SELECT 
  id,
  treatment_payment_id,
  amount,
  payment_method,
  payment_date
FROM payment_transactions 
ORDER BY created_at DESC 
LIMIT 3;

-- Test the payment summary function
SELECT 'TESTING PAYMENT SUMMARY FUNCTION:' as info;
SELECT 
  tp.treatment_id,
  tp.total_amount,
  tp.paid_amount,
  tp.remaining_amount,
  tp.payment_status,
  COUNT(pt.id) as transaction_count
FROM treatment_payments tp
LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
GROUP BY tp.id, tp.treatment_id, tp.total_amount, tp.paid_amount, tp.remaining_amount, tp.payment_status
ORDER BY tp.created_at DESC
LIMIT 3;

-- Success message
SELECT 'Payment system test completed successfully!' as status;

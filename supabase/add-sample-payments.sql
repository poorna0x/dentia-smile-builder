-- =====================================================
-- 💰 ADD SAMPLE PAYMENT DATA FOR TESTING
-- =====================================================

-- First, let's check what data we have
SELECT 'CHECKING EXISTING DATA:' as info;

-- Check if we have any treatment payments
SELECT 'TREATMENT PAYMENTS:' as info;
SELECT COUNT(*) as total_treatment_payments FROM treatment_payments;

-- Check if we have any payment transactions
SELECT 'PAYMENT TRANSACTIONS:' as info;
SELECT COUNT(*) as total_payment_transactions FROM payment_transactions;

-- Check if we have any dental treatments
SELECT 'DENTAL TREATMENTS:' as info;
SELECT COUNT(*) as total_dental_treatments FROM dental_treatments;

-- Check if we have any patients
SELECT 'PATIENTS:' as info;
SELECT COUNT(*) as total_patients FROM patients;

-- Get clinic ID for testing
SELECT 'CLINIC ID FOR TESTING:' as info;
SELECT id, name FROM clinics LIMIT 1;

-- Add sample payment data if we have the required tables
DO $$
DECLARE
  clinic_uuid UUID;
  treatment_id UUID;
  patient_id UUID;
  treatment_payment_id UUID;
BEGIN
  -- Get clinic ID
  SELECT id INTO clinic_uuid FROM clinics LIMIT 1;
  
  IF clinic_uuid IS NOT NULL THEN
    -- Get or create a treatment
    SELECT id INTO treatment_id FROM dental_treatments WHERE clinic_id = clinic_uuid LIMIT 1;
    
    IF treatment_id IS NULL THEN
      -- Create a sample treatment if none exists
      INSERT INTO dental_treatments (clinic_id, patient_id, treatment_type_id, treatment_date, status, notes)
      VALUES (
        clinic_uuid,
        (SELECT id FROM patients WHERE clinic_id = clinic_uuid LIMIT 1),
        (SELECT id FROM treatment_types WHERE clinic_id = clinic_uuid LIMIT 1),
        CURRENT_DATE,
        'Completed',
        'Sample treatment for testing'
      ) RETURNING id INTO treatment_id;
    END IF;
    
    -- Get or create a patient
    SELECT id INTO patient_id FROM patients WHERE clinic_id = clinic_uuid LIMIT 1;
    
    IF patient_id IS NULL THEN
      -- Create a sample patient if none exists
      INSERT INTO patients (clinic_id, name, phone, email, date_of_birth, gender, address)
      VALUES (
        clinic_uuid,
        'Sample Patient',
        '9876543210',
        'sample@example.com',
        '1990-01-01',
        'Other',
        'Sample Address'
      ) RETURNING id INTO patient_id;
    END IF;
    
    -- Create sample treatment payment
    INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
    VALUES (
      treatment_id,
      clinic_uuid,
      patient_id,
      5000.00,
      5000.00,
      'Completed'
    ) RETURNING id INTO treatment_payment_id;
    
    -- Add sample payment transactions with different methods
    INSERT INTO payment_transactions (treatment_payment_id, amount, payment_date, payment_method, notes)
    VALUES 
      (treatment_payment_id, 2000.00, CURRENT_DATE, 'Cash', 'Cash payment for consultation'),
      (treatment_payment_id, 2000.00, CURRENT_DATE, 'UPI', 'UPI payment via PhonePe for treatment'),
      (treatment_payment_id, 1000.00, CURRENT_DATE, 'Card', 'Card payment for follow-up');
    
    RAISE NOTICE 'Sample payment data added successfully!';
  ELSE
    RAISE NOTICE 'No clinic found. Please create a clinic first.';
  END IF;
END $$;

-- Verify the sample data was added
SELECT 'VERIFYING SAMPLE DATA:' as info;

SELECT 'PAYMENT TRANSACTIONS WITH METHODS:' as info;
SELECT 
  pt.payment_method,
  pt.amount,
  pt.payment_date,
  pt.notes
FROM payment_transactions pt
ORDER BY pt.payment_date DESC
LIMIT 10;

-- Success message
SELECT 'Sample payment data added successfully!' as status;

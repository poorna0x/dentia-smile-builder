-- =====================================================
-- 🔍 CHECK EXISTING DATA (CORRECTED)
-- =====================================================

-- Check table structures first
SELECT 'TABLE STRUCTURES:' as info;

-- Check dental_treatments columns
SELECT 'DENTAL_TREATMENTS COLUMNS:' as table_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dental_treatments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check appointments columns
SELECT 'APPOINTMENTS COLUMNS:' as table_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check treatment_payments columns
SELECT 'TREATMENT_PAYMENTS COLUMNS:' as table_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'treatment_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Now check actual data with correct column names
SELECT 'ACTUAL DATA:' as info;

-- Check clinics
SELECT 'CLINICS:' as table_name;
SELECT id, name, slug FROM clinics LIMIT 5;

-- Check appointments
SELECT 'APPOINTMENTS:' as table_name;
SELECT id, name, date, status, clinic_id FROM appointments LIMIT 5;

-- Check dental_treatments (without created_at)
SELECT 'DENTAL_TREATMENTS:' as table_name;
SELECT id, treatment_name, clinic_id FROM dental_treatments LIMIT 5;

-- Check dentists
SELECT 'DENTISTS:' as table_name;
SELECT id, name, clinic_id FROM dentists LIMIT 5;

-- Check treatment_payments
SELECT 'TREATMENT_PAYMENTS:' as table_name;
SELECT id, treatment_id, clinic_id, total_amount, paid_amount FROM treatment_payments LIMIT 5;

-- Check payment_transactions
SELECT 'PAYMENT_TRANSACTIONS:' as table_name;
SELECT id, treatment_payment_id, amount, payment_date, notes FROM payment_transactions LIMIT 5;

-- Check doctor_attributions
SELECT 'DOCTOR_ATTRIBUTIONS:' as table_name;
SELECT id, treatment_id, doctor_id, attribution_type FROM doctor_attributions LIMIT 5;

-- Count records
SELECT 'COUNTS:' as summary;
SELECT 
  (SELECT COUNT(*) FROM clinics) as clinics_count,
  (SELECT COUNT(*) FROM appointments) as appointments_count,
  (SELECT COUNT(*) FROM dental_treatments) as treatments_count,
  (SELECT COUNT(*) FROM dentists) as dentists_count,
  (SELECT COUNT(*) FROM treatment_payments) as payments_count,
  (SELECT COUNT(*) FROM payment_transactions) as transactions_count,
  (SELECT COUNT(*) FROM doctor_attributions) as attributions_count;

-- =====================================================
-- 👀 PREVIEW DATA TO BE CLEARED
-- =====================================================
-- 
-- This script shows you what data will be deleted
-- Run this first to see what you're about to delete
-- =====================================================

-- Show current data counts
SELECT 'Current data counts (what will be deleted):' as info;

SELECT 'patients' as table_name, COUNT(*) as record_count FROM patients
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'dental_treatments', COUNT(*) FROM dental_treatments
UNION ALL
SELECT 'tooth_conditions', COUNT(*) FROM tooth_conditions
UNION ALL
SELECT 'lab_work', COUNT(*) FROM lab_work
UNION ALL
SELECT 'prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'medical_records', COUNT(*) FROM medical_records
UNION ALL
SELECT 'treatment_payments', COUNT(*) FROM treatment_payments
UNION ALL
SELECT 'payment_transactions', COUNT(*) FROM payment_transactions
UNION ALL
SELECT 'patient_phones', COUNT(*) FROM patient_phones
UNION ALL
SELECT 'scheduling_settings', COUNT(*) FROM scheduling_settings
UNION ALL
SELECT 'disabled_slots', COUNT(*) FROM disabled_slots
UNION ALL
SELECT 'push_subscriptions', COUNT(*) FROM push_subscriptions
ORDER BY record_count DESC, table_name;

-- Show sample data from each table
SELECT 'Sample patients:' as info;
SELECT id, first_name, last_name, phone, created_at FROM patients LIMIT 5;

SELECT 'Sample appointments:' as info;
SELECT id, name, phone, date, time, status FROM appointments LIMIT 5;

SELECT 'Sample dental treatments:' as info;
SELECT id, patient_id, treatment_type, treatment_date FROM dental_treatments LIMIT 5;

SELECT 'Sample lab work:' as info;
SELECT id, patient_id, work_type, status FROM lab_work LIMIT 5;

-- Show what will remain (clinics)
SELECT 'What will remain (clinics):' as info;
SELECT id, name, slug, contact_phone FROM clinics;

-- =====================================================
-- ⚠️ WARNING SUMMARY
-- =====================================================
-- 
-- This will delete ALL the data shown above
-- Only clinics will remain
-- 
-- If you're sure, run: scripts/clear-all-data-except-clinics.sql
-- 
-- =====================================================

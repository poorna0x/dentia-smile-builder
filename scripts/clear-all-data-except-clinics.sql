-- =====================================================
-- 🗑️ CLEAR ALL DATA EXCEPT CLINICS
-- =====================================================
-- 
-- This script deletes all records from all tables except clinics
-- Use this to clear test data while keeping clinic configuration
-- 
-- ⚠️ WARNING: This will permanently delete all data!
-- Make sure you have backups if needed
-- =====================================================

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = replica;

-- Clear all data from tables (in dependency order)

-- 1. Clear payment-related tables
DELETE FROM payment_transactions;
DELETE FROM treatment_payments;

-- 2. Clear lab work related tables
DELETE FROM lab_work;

-- 3. Clear dental treatment related tables
DELETE FROM dental_treatments;
DELETE FROM tooth_conditions;
DELETE FROM dental_notes;

-- 4. Clear medical records and prescriptions
DELETE FROM medical_records;
DELETE FROM prescriptions;

-- 5. Clear appointments
DELETE FROM appointments;

-- 6. Clear patient-related tables
DELETE FROM patient_phones;
DELETE FROM patients;

-- 7. Clear scheduling settings (but keep clinic structure)
DELETE FROM scheduling_settings;

-- 8. Clear disabled slots
DELETE FROM disabled_slots;

-- 9. Clear push subscriptions
DELETE FROM push_subscriptions;

-- 10. Clear patient auth (if exists)
DELETE FROM patient_auth;

-- 11. Clear treatment plans
DELETE FROM treatment_plans;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- =====================================================
-- ✅ VERIFICATION QUERIES
-- =====================================================

-- Check that clinics still exist
SELECT 'Clinics remaining:' as info;
SELECT COUNT(*) as clinic_count FROM clinics;

-- Check that all other tables are empty
SELECT 'Verifying all tables are empty:' as info;

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
ORDER BY table_name;

-- =====================================================
-- ✅ DATA CLEARED SUCCESSFULLY
-- =====================================================
-- 
-- All data has been cleared except clinics
-- You can now start fresh with clean data
-- 
-- =====================================================

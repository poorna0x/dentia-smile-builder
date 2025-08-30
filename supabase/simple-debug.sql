-- =====================================================
-- 🔍 SIMPLE DEBUG - CHECK YOUR DATA
-- =====================================================

-- 1. Check if you have clinics
SELECT 'CLINICS:' as section, COUNT(*) as count FROM clinics;

-- 2. Check if you have dentists
SELECT 'DENTISTS:' as section, COUNT(*) as count FROM dentists;

-- 3. Check if you have dental treatments
SELECT 'DENTAL TREATMENTS:' as section, COUNT(*) as count FROM dental_treatments;

-- 4. Check if you have doctor attributions
SELECT 'DOCTOR ATTRIBUTIONS:' as section, COUNT(*) as count FROM doctor_attributions;

-- 5. Check if you have payment data
SELECT 'TREATMENT PAYMENTS:' as section, COUNT(*) as count FROM treatment_payments;
SELECT 'PAYMENT TRANSACTIONS:' as section, COUNT(*) as count FROM payment_transactions;

-- 6. Check treatment types
SELECT 'TREATMENT TYPES:' as section, treatment_type, COUNT(*) as count 
FROM dental_treatments 
GROUP BY treatment_type;

-- 7. Check if treatments have dates
SELECT 'TREATMENTS WITH DATES:' as section, COUNT(*) as count 
FROM dental_treatments 
WHERE treatment_date IS NOT NULL;

SELECT 'TREATMENTS WITHOUT DATES:' as section, COUNT(*) as count 
FROM dental_treatments 
WHERE treatment_date IS NULL;

-- 8. Check date range
SELECT 'DATE RANGE:' as section, 
       MIN(treatment_date) as earliest, 
       MAX(treatment_date) as latest 
FROM dental_treatments 
WHERE treatment_date IS NOT NULL;

-- 9. Check doctor names
SELECT 'DOCTOR NAMES:' as section, name FROM dentists;

-- 10. Check if any treatments are linked to doctors
SELECT 'TREATMENTS LINKED TO DOCTORS:' as section, COUNT(*) as count
FROM dental_treatments dt
JOIN doctor_attributions da ON dt.id = da.treatment_id;

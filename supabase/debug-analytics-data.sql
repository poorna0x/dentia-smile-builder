-- =====================================================
-- 🔍 DEBUG ANALYTICS DATA
-- =====================================================

-- Check what data we have
SELECT '=== DATA OVERVIEW ===' as section;

-- 1. Check clinics
SELECT 'Clinics:' as info, COUNT(*) as count FROM clinics;

-- 2. Check dentists
SELECT 'Dentists:' as info, COUNT(*) as count FROM dentists;

-- 3. Check dental treatments
SELECT 'Dental Treatments:' as info, COUNT(*) as count FROM dental_treatments;

-- 4. Check doctor attributions
SELECT 'Doctor Attributions:' as info, COUNT(*) as count FROM doctor_attributions;

-- 5. Check payment data
SELECT 'Treatment Payments:' as info, COUNT(*) as count FROM treatment_payments;
SELECT 'Payment Transactions:' as info, COUNT(*) as count FROM payment_transactions;

-- =====================================================
-- CHECK TREATMENT BREAKDOWN DATA
-- =====================================================

SELECT '=== TREATMENT BREAKDOWN ANALYSIS ===' as section;

-- Check treatment types and their counts
SELECT 
  treatment_type,
  COUNT(*) as count,
  SUM(cost) as total_revenue,
  AVG(cost) as avg_cost
FROM dental_treatments
GROUP BY treatment_type
ORDER BY count DESC;

-- Check if treatments have dates
SELECT 
  'Treatments with dates:' as info,
  COUNT(*) as count
FROM dental_treatments 
WHERE treatment_date IS NOT NULL;

SELECT 
  'Treatments without dates:' as info,
  COUNT(*) as count
FROM dental_treatments 
WHERE treatment_date IS NULL;

-- Check date range of treatments
SELECT 
  'Date range:' as info,
  MIN(treatment_date) as earliest_date,
  MAX(treatment_date) as latest_date
FROM dental_treatments
WHERE treatment_date IS NOT NULL;

-- =====================================================
-- CHECK DOCTOR PERFORMANCE DATA
-- =====================================================

SELECT '=== DOCTOR PERFORMANCE ANALYSIS ===' as section;

-- Check doctor attributions by type
SELECT 
  attribution_type,
  COUNT(*) as count
FROM doctor_attributions
GROUP BY attribution_type;

-- Check if doctors have attributions
SELECT 
  d.name as doctor_name,
  COUNT(da.treatment_id) as attribution_count
FROM dentists d
LEFT JOIN doctor_attributions da ON d.id = da.doctor_id
GROUP BY d.id, d.name
ORDER BY attribution_count DESC;

-- =====================================================
-- TEST ANALYTICS FUNCTIONS MANUALLY
-- =====================================================

SELECT '=== TESTING ANALYTICS FUNCTIONS ===' as section;

-- Get a clinic ID for testing
DO $$
DECLARE
  clinic_uuid UUID;
  income_result RECORD;
  doctor_result RECORD;
  appointment_result RECORD;
  treatment_result RECORD;
BEGIN
  -- Get a clinic
  SELECT id INTO clinic_uuid FROM clinics LIMIT 1;
  
  IF clinic_uuid IS NOT NULL THEN
    RAISE NOTICE 'Testing with clinic: %', clinic_uuid;
    
    -- Test income breakdown
    SELECT * INTO income_result FROM get_income_breakdown(clinic_uuid, '2024-01-01', '2024-12-31');
    RAISE NOTICE 'Income breakdown: %', income_result;
    
    -- Test doctor analytics
    SELECT * INTO doctor_result FROM get_enhanced_doctor_analytics(clinic_uuid, '2024-01-01', '2024-12-31') LIMIT 1;
    RAISE NOTICE 'Doctor analytics: %', doctor_result;
    
    -- Test appointment analytics
    SELECT * INTO appointment_result FROM get_appointment_analytics(clinic_uuid, '2024-01-01', '2024-12-31');
    RAISE NOTICE 'Appointment analytics: %', appointment_result;
    
    -- Test treatment analytics
    SELECT * INTO treatment_result FROM get_treatment_analytics(clinic_uuid, '2024-01-01', '2024-12-31');
    RAISE NOTICE 'Treatment analytics: %', treatment_result;
    
  ELSE
    RAISE NOTICE 'No clinics found';
  END IF;
END $$;

-- =====================================================
-- SUGGESTIONS
-- =====================================================

SELECT '=== SUGGESTIONS ===' as section;

-- If no doctor attributions, suggest creating them
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM doctor_attributions) = 0 
    THEN '⚠️ No doctor attributions found. Run setup-sample-doctor-data.sql'
    ELSE '✅ Doctor attributions exist'
  END as doctor_attributions_status;

-- If no payment data, suggest creating it
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM payment_transactions) = 0 
    THEN '⚠️ No payment transactions found. Income breakdown will be empty'
    ELSE '✅ Payment transactions exist'
  END as payment_status;

-- If treatments have no dates, suggest updating them
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM dental_treatments WHERE treatment_date IS NULL) > 0 
    THEN '⚠️ Some treatments have no dates. Analytics may not work properly'
    ELSE '✅ All treatments have dates'
  END as treatment_dates_status;

-- Success message
SELECT '🔍 Analytics data debug completed!' as status;

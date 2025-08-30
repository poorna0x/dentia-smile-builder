-- =====================================================
-- 🏥 SETUP SAMPLE DOCTOR ATTRIBUTION DATA (FIXED)
-- =====================================================

-- First, let's check what data we have
SELECT 'Checking existing data...' as step;

-- Check dentists
SELECT 'Dentists:' as info, COUNT(*) as count FROM dentists;

-- Check dental treatments
SELECT 'Dental Treatments:' as info, COUNT(*) as count FROM dental_treatments;

-- Check doctor attributions
SELECT 'Doctor Attributions:' as info, COUNT(*) as count FROM doctor_attributions;

-- Check if we have any treatments without doctor attributions
SELECT 'Treatments without doctor attributions:' as info, COUNT(*) as count 
FROM dental_treatments dt 
LEFT JOIN doctor_attributions da ON dt.id = da.treatment_id 
WHERE da.treatment_id IS NULL;

-- =====================================================
-- CREATE SAMPLE DOCTOR ATTRIBUTIONS (FIXED)
-- =====================================================

-- Get some sample treatments and dentists
WITH sample_data AS (
  SELECT 
    dt.id as treatment_id,
    dt.clinic_id,
    dt.cost,
    d.id as doctor_id
  FROM dental_treatments dt
  CROSS JOIN dentists d
  WHERE dt.clinic_id = d.clinic_id
  LIMIT 20
)
INSERT INTO doctor_attributions (
  treatment_id,
  clinic_id,
  doctor_id,
  attribution_type,
  attribution_percentage,
  started_at,
  completed_at,
  notes
)
SELECT 
  sd.treatment_id,
  sd.clinic_id,
  sd.doctor_id,
  (CASE 
    WHEN RANDOM() < 0.4 THEN 'Started'
    WHEN RANDOM() < 0.7 THEN 'Completed'
    ELSE 'Assisted'
  END)::doctor_attribution_type as attribution_type,
  CASE 
    WHEN RANDOM() < 0.4 THEN 100
    WHEN RANDOM() < 0.7 THEN 80
    ELSE 60
  END as attribution_percentage,
  NOW() - INTERVAL '1 day' * (RANDOM() * 30)::INTEGER as started_at,
  CASE 
    WHEN RANDOM() < 0.7 THEN NOW() - INTERVAL '1 day' * (RANDOM() * 30)::INTEGER
    ELSE NULL
  END as completed_at,
  'Sample attribution data for analytics testing' as notes
FROM sample_data sd
ON CONFLICT (treatment_id, doctor_id) DO NOTHING;

-- =====================================================
-- VERIFY THE DATA
-- =====================================================

SELECT 'After setup - Doctor Attributions:' as info, COUNT(*) as count FROM doctor_attributions;

-- Show sample attributions
SELECT 
  da.attribution_type,
  da.attribution_percentage,
  d.name as doctor_name,
  dt.treatment_type,
  dt.cost
FROM doctor_attributions da
JOIN dentists d ON da.doctor_id = d.id
JOIN dental_treatments dt ON da.treatment_id = dt.id
LIMIT 10;

-- Test the analytics function
SELECT 'Testing doctor analytics function...' as step;

DO $$
DECLARE
  clinic_uuid UUID;
BEGIN
  -- Get a clinic
  SELECT id INTO clinic_uuid FROM clinics LIMIT 1;
  
  IF clinic_uuid IS NOT NULL THEN
    -- Test the function
    PERFORM * FROM get_enhanced_doctor_analytics(clinic_uuid, '2024-01-01', '2024-12-31');
    RAISE NOTICE '✅ Doctor analytics function tested successfully for clinic: %', clinic_uuid;
  ELSE
    RAISE NOTICE '⚠️ No clinics found for testing';
  END IF;
END $$;

-- Success message
SELECT '🎉 Sample doctor attribution data created successfully!' as status;

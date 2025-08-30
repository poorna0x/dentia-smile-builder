-- =====================================================
-- 🏥 SIMPLE DOCTOR ATTRIBUTIONS SETUP (FIXED)
-- =====================================================

-- First, let's check what data we have
SELECT 'Checking existing data...' as step;

-- Check dentists
SELECT 'Dentists:' as info, COUNT(*) as count FROM dentists;

-- Check dental treatments
SELECT 'Dental Treatments:' as info, COUNT(*) as count FROM dental_treatments;

-- Check doctor attributions
SELECT 'Doctor Attributions:' as info, COUNT(*) as count FROM doctor_attributions;

-- =====================================================
-- CREATE SIMPLE DOCTOR ATTRIBUTIONS (FIXED)
-- =====================================================

-- Get some sample treatments and dentists, avoiding duplicates
WITH sample_data AS (
  SELECT DISTINCT
    dt.id as treatment_id,
    dt.clinic_id,
    dt.cost,
    d.id as doctor_id
  FROM dental_treatments dt
  CROSS JOIN dentists d
  WHERE dt.clinic_id = d.clinic_id
  AND NOT EXISTS (
    SELECT 1 FROM doctor_attributions da 
    WHERE da.treatment_id = dt.id AND da.doctor_id = d.id
  )
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
  'Started'::doctor_attribution_type as attribution_type,
  100 as attribution_percentage,
  NOW() - INTERVAL '1 day' * 5 as started_at,
  NOW() - INTERVAL '1 day' * 2 as completed_at,
  'Sample attribution data for analytics testing' as notes
FROM sample_data sd;

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

-- Success message
SELECT '🎉 Simple doctor attribution data created successfully!' as status;

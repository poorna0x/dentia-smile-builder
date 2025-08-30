-- =====================================================
-- 🔍 CHECK ENUM VALUES FOR doctor_attribution_type
-- =====================================================

-- Check what ENUM values are available
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'doctor_attribution_type'
ORDER BY e.enumsortorder;

-- Also check the table structure
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'doctor_attributions' 
AND column_name = 'attribution_type';

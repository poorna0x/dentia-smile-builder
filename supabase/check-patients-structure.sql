-- =====================================================
-- 🔍 CHECK PATIENTS TABLE STRUCTURE
-- =====================================================

-- Check if patients table exists
SELECT 'Checking patients table...' as step;

SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'patients';

-- Check patients table structure
SELECT 'Patients table structure:' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- Check sample data
SELECT 'Sample patients data:' as info;

SELECT * FROM patients LIMIT 3;

-- Check dental_treatments structure
SELECT 'Dental treatments table structure:' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'dental_treatments'
ORDER BY ordinal_position;

-- Check sample dental_treatments data
SELECT 'Sample dental_treatments data:' as info;

SELECT * FROM dental_treatments LIMIT 3;

-- 🔍 PATIENT_PHONES TABLE DIAGNOSTIC SCRIPT
-- Run this to investigate why 20 records are taking 52 MB

-- =====================================================
-- 1. BASIC TABLE INFORMATION
-- =====================================================

-- Check table structure
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'patient_phones'
ORDER BY ordinal_position;

-- =====================================================
-- 2. DETAILED STORAGE ANALYSIS
-- =====================================================

-- Get exact storage breakdown
SELECT 
  'patient_phones' as table_name,
  pg_size_pretty(pg_total_relation_size('public.patient_phones')) as total_size,
  pg_size_pretty(pg_relation_size('public.patient_phones')) as table_size,
  pg_size_pretty(pg_total_relation_size('public.patient_phones') - pg_relation_size('public.patient_phones')) as index_size,
  pg_total_relation_size('public.patient_phones') as total_bytes,
  pg_relation_size('public.patient_phones') as table_bytes,
  (pg_total_relation_size('public.patient_phones') - pg_relation_size('public.patient_phones')) as index_bytes
FROM information_schema.tables 
WHERE table_name = 'patient_phones';

-- =====================================================
-- 3. INDEX ANALYSIS
-- =====================================================

-- Check all indexes on patient_phones table
SELECT 
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
  pg_relation_size(indexname::regclass) as size_bytes
FROM pg_indexes 
WHERE tablename = 'patient_phones'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- =====================================================
-- 4. DATA ANALYSIS
-- =====================================================

-- Check actual data in the table
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT phone) as unique_phones,
  COUNT(DISTINCT patient_id) as unique_patients,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM patient_phones;

-- Show sample data
SELECT 
  id,
  phone,
  patient_id,
  created_at,
  updated_at,
  LENGTH(phone) as phone_length,
  LENGTH(patient_id::text) as patient_id_length
FROM patient_phones
LIMIT 10;

-- =====================================================
-- 5. CHECK FOR LARGE TEXT FIELDS
-- =====================================================

-- Check if any columns have unusually large data
SELECT 
  'phone' as column_name,
  MAX(LENGTH(phone)) as max_length,
  AVG(LENGTH(phone)) as avg_length,
  COUNT(*) as total_records
FROM patient_phones

UNION ALL

SELECT 
  'patient_id' as column_name,
  MAX(LENGTH(patient_id::text)) as max_length,
  AVG(LENGTH(patient_id::text)) as avg_length,
  COUNT(*) as total_records
FROM patient_phones;

-- =====================================================
-- 6. CHECK FOR BLOATED INDEXES
-- =====================================================

-- Check index bloat
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
  pg_relation_size(indexname::regclass) as size_bytes,
  'Run REINDEX INDEX ' || indexname || '; to fix bloat' as recommendation
FROM pg_indexes 
WHERE tablename = 'patient_phones'
  AND pg_relation_size(indexname::regclass) > 1024 * 1024  -- Larger than 1MB
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- =====================================================
-- 7. CHECK FOR TOAST TABLES
-- =====================================================

-- Check if there's a TOAST table (for large data)
SELECT 
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(oid)) as size,
  pg_total_relation_size(oid) as size_bytes
FROM pg_class 
WHERE relname LIKE 'patient_phones%'
ORDER BY pg_total_relation_size(oid) DESC;

-- =====================================================
-- 8. RECOMMENDATIONS
-- =====================================================

-- Generate recommendations based on findings
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'patient_phones' 
      AND pg_relation_size(indexname::regclass) > 1024 * 1024
    ) THEN 'Large indexes detected - consider dropping unnecessary indexes'
    ELSE 'No large indexes found'
  END as recommendation

UNION ALL

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_class 
      WHERE relname LIKE 'patient_phones%' 
      AND relname != 'patient_phones'
    ) THEN 'TOAST table detected - check for large text fields'
    ELSE 'No TOAST table found'
  END as recommendation

UNION ALL

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM patient_phones) < 100 
    AND (SELECT pg_total_relation_size('public.patient_phones')) > 1024 * 1024
    THEN 'Table is abnormally large for the number of records - run VACUUM ANALYZE'
    ELSE 'Table size seems reasonable'
  END as recommendation;






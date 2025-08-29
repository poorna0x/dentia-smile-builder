-- 🗄️ Storage Analysis and Optimization Script
-- Run this in Supabase SQL Editor to analyze storage usage

-- =====================================================
-- 1. ANALYZE TABLE SIZES AND ROW COUNTS
-- =====================================================

-- Get detailed storage information for all tables
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
  (SELECT count(*) FROM information_schema.tables t2 WHERE t2.table_name = t1.tablename) as row_count_estimate
FROM pg_tables t1
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 2. ANALYZE PATIENT_PHONES TABLE (MAIN ISSUE)
-- =====================================================

-- Check patient_phones table structure and data
SELECT 
  'patient_phones' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT phone) as unique_phones,
  COUNT(DISTINCT patient_id) as unique_patients,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM patient_phones;

-- Check for duplicate entries in patient_phones
SELECT 
  phone,
  COUNT(*) as duplicate_count,
  COUNT(DISTINCT patient_id) as unique_patients
FROM patient_phones
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- Check patient_phones table structure
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_phones'
ORDER BY ordinal_position;

-- =====================================================
-- 3. ANALYZE INDEX SIZES
-- =====================================================

-- Check large indexes
SELECT 
  indexname,
  tablename,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
  pg_relation_size(indexname::regclass) as size_bytes
FROM pg_indexes 
WHERE schemaname = 'public'
  AND pg_relation_size(indexname::regclass) > 1024 * 1024  -- Larger than 1MB
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- =====================================================
-- 4. ANALYZE APPOINTMENTS TABLE
-- =====================================================

-- Check appointments table
SELECT 
  'appointments' as table_name,
  COUNT(*) as total_appointments,
  COUNT(DISTINCT clinic_id) as unique_clinics,
  COUNT(DISTINCT phone) as unique_phones,
  MIN(created_at) as earliest_appointment,
  MAX(created_at) as latest_appointment,
  COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
  COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed
FROM appointments;

-- =====================================================
-- 5. ANALYZE PATIENTS TABLE
-- =====================================================

-- Check patients table
SELECT 
  'patients' as table_name,
  COUNT(*) as total_patients,
  COUNT(DISTINCT clinic_id) as unique_clinics,
  COUNT(DISTINCT phone) as unique_phones,
  MIN(created_at) as earliest_patient,
  MAX(created_at) as latest_patient
FROM patients;

-- =====================================================
-- 6. STORAGE OPTIMIZATION RECOMMENDATIONS
-- =====================================================

-- Check for unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'  -- Don't suggest removing primary keys
  AND indexname NOT LIKE '%_key'   -- Don't suggest removing unique constraints
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Check for potential data cleanup opportunities
SELECT 
  'appointments_older_than_1_year' as cleanup_target,
  COUNT(*) as records_to_cleanup
FROM appointments 
WHERE created_at < NOW() - INTERVAL '1 year'
  AND status IN ('Completed', 'Cancelled');

SELECT 
  'patient_phones_duplicates' as cleanup_target,
  COUNT(*) as duplicate_records
FROM (
  SELECT phone, COUNT(*) as cnt
  FROM patient_phones
  GROUP BY phone
  HAVING COUNT(*) > 1
) duplicates;

-- =====================================================
-- 7. SUMMARY REPORT
-- =====================================================

-- Overall storage summary
WITH storage_summary AS (
  SELECT 
    SUM(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    COUNT(*) as table_count
  FROM pg_tables 
  WHERE schemaname = 'public'
),
largest_table AS (
  SELECT 
    tablename,
    pg_total_relation_size(schemaname||'.'||tablename) as size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 1
)
SELECT 
  'TOTAL_STORAGE_USAGE' as metric,
  pg_size_pretty(total_size) as value
FROM storage_summary

UNION ALL

SELECT 
  'LARGEST_TABLE' as metric,
  tablename || ' (' || pg_size_pretty(size) || ')' as value
FROM largest_table

UNION ALL

SELECT 
  'TOTAL_TABLES' as metric,
  table_count::text as value
FROM storage_summary;

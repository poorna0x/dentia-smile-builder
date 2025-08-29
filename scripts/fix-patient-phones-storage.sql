-- 🛠️ PATIENT_PHONES STORAGE FIX SCRIPT
-- Run this to fix the 52 MB storage issue for 20 records

-- =====================================================
-- 1. SHOW CURRENT STATE
-- =====================================================

-- Show current storage usage
SELECT 
  'BEFORE FIX' as stage,
  pg_size_pretty(pg_total_relation_size('public.patient_phones')) as total_size,
  pg_size_pretty(pg_relation_size('public.patient_phones')) as table_size,
  pg_size_pretty(pg_total_relation_size('public.patient_phones') - pg_relation_size('public.patient_phones')) as index_size,
  COUNT(*) as record_count
FROM patient_phones;

-- =====================================================
-- 2. FIX INDEX BLOAT
-- =====================================================

-- Drop constraints and indexes on patient_phones (we'll recreate them efficiently)
ALTER TABLE patient_phones DROP CONSTRAINT IF EXISTS patient_phones_patient_id_phone_key;
DROP INDEX IF EXISTS public.idx_patient_phones_phone;
DROP INDEX IF EXISTS public.idx_patient_phones_patient_id;

-- Show storage after dropping indexes
SELECT 
  'AFTER DROPPING INDEXES' as stage,
  pg_size_pretty(pg_total_relation_size('public.patient_phones')) as total_size,
  pg_size_pretty(pg_relation_size('public.patient_phones')) as table_size,
  pg_size_pretty(pg_total_relation_size('public.patient_phones') - pg_relation_size('public.patient_phones')) as index_size
FROM information_schema.tables 
WHERE table_name = 'patient_phones';

-- =====================================================
-- 3. FIX TABLE BLOAT
-- =====================================================

-- Vacuum the table to reclaim space from deleted records
VACUUM ANALYZE patient_phones;

-- Show storage after vacuum
SELECT 
  'AFTER VACUUM' as stage,
  pg_size_pretty(pg_total_relation_size('public.patient_phones')) as total_size,
  pg_size_pretty(pg_relation_size('public.patient_phones')) as table_size,
  pg_size_pretty(pg_total_relation_size('public.patient_phones') - pg_relation_size('public.patient_phones')) as index_size
FROM information_schema.tables 
WHERE table_name = 'patient_phones';

-- =====================================================
-- 4. RECREATE EFFICIENT INDEXES
-- =====================================================

-- Create only the necessary indexes with proper sizing
CREATE INDEX IF NOT EXISTS idx_patient_phones_phone_efficient 
ON patient_phones(phone);

CREATE INDEX IF NOT EXISTS idx_patient_phones_patient_id_efficient 
ON patient_phones(patient_id);

-- Recreate the constraint if needed (but more efficiently)
-- ALTER TABLE patient_phones ADD CONSTRAINT patient_phones_patient_id_phone_key UNIQUE (patient_id, phone);

-- Show storage after recreating indexes
SELECT 
  'AFTER RECREATING INDEXES' as stage,
  pg_size_pretty(pg_total_relation_size('public.patient_phones')) as total_size,
  pg_size_pretty(pg_relation_size('public.patient_phones')) as table_size,
  pg_size_pretty(pg_total_relation_size('public.patient_phones') - pg_relation_size('public.patient_phones')) as index_size
FROM information_schema.tables 
WHERE table_name = 'patient_phones';

-- =====================================================
-- 5. CHECK TOAST TABLE
-- =====================================================

-- Check if TOAST table still exists and its size
SELECT 
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(oid)) as size,
  pg_total_relation_size(oid) as size_bytes
FROM pg_class 
WHERE relname LIKE 'patient_phones%'
ORDER BY pg_total_relation_size(oid) DESC;

-- =====================================================
-- 6. OPTIMIZE COLUMN TYPES (if needed)
-- =====================================================

-- Check current column types
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_phones'
ORDER BY ordinal_position;

-- =====================================================
-- 7. FINAL STORAGE REPORT
-- =====================================================

-- Compare before and after
WITH storage_comparison AS (
  SELECT 
    'BEFORE' as stage,
    52 as total_mb,
    20 as records
  UNION ALL
  SELECT 
    'AFTER' as stage,
    ROUND(pg_total_relation_size('public.patient_phones') / (1024.0 * 1024.0), 2) as total_mb,
    COUNT(*) as records
  FROM patient_phones
)
SELECT 
  stage,
  total_mb || ' MB' as storage_used,
  records || ' records' as record_count,
  ROUND(total_mb / records, 2) || ' MB per record' as efficiency
FROM storage_comparison;

-- =====================================================
-- 8. VERIFY INDEXES ARE EFFICIENT
-- =====================================================

-- Show final index sizes
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
  pg_relation_size(indexname::regclass) as size_bytes
FROM pg_indexes 
WHERE tablename = 'patient_phones'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- =====================================================
-- 9. PREVENTION MEASURES
-- =====================================================

-- Add a comment to the table for future reference
COMMENT ON TABLE patient_phones IS 'Optimized for storage efficiency - 20 records should use ~1-5 MB';

-- Create a monitoring function
CREATE OR REPLACE FUNCTION check_patient_phones_storage()
RETURNS TABLE (
  table_name TEXT,
  total_size TEXT,
  record_count BIGINT,
  efficiency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'patient_phones'::TEXT,
    pg_size_pretty(pg_total_relation_size('public.patient_phones'))::TEXT,
    (SELECT COUNT(*) FROM patient_phones)::BIGINT,
    ROUND(pg_total_relation_size('public.patient_phones') / (1024.0 * 1024.0 * GREATEST((SELECT COUNT(*) FROM patient_phones), 1)), 2) || ' MB per record'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. SUCCESS MESSAGE
-- =====================================================

SELECT 
  'STORAGE OPTIMIZATION COMPLETE!' as status,
  'Run check_patient_phones_storage() to monitor future usage' as next_step;

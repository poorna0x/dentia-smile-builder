-- 🛠️ PATIENT_PHONES STORAGE FIX - PART 2
-- Run this AFTER running VACUUM ANALYZE patient_phones;

-- =====================================================
-- 1. CHECK STORAGE AFTER VACUUM
-- =====================================================

-- Show storage after vacuum (should be much smaller)
SELECT 
  'AFTER VACUUM' as stage,
  pg_size_pretty(pg_total_relation_size('public.patient_phones')) as total_size,
  pg_size_pretty(pg_relation_size('public.patient_phones')) as table_size,
  pg_size_pretty(pg_total_relation_size('public.patient_phones') - pg_relation_size('public.patient_phones')) as index_size
FROM information_schema.tables 
WHERE table_name = 'patient_phones';

-- =====================================================
-- 2. RECREATE EFFICIENT INDEXES
-- =====================================================

-- Create only the necessary indexes with proper sizing
CREATE INDEX IF NOT EXISTS idx_patient_phones_phone_efficient 
ON patient_phones(phone);

CREATE INDEX IF NOT EXISTS idx_patient_phones_patient_id_efficient 
ON patient_phones(patient_id);

-- Show storage after recreating indexes
SELECT 
  'AFTER RECREATING INDEXES' as stage,
  pg_size_pretty(pg_total_relation_size('public.patient_phones')) as total_size,
  pg_size_pretty(pg_relation_size('public.patient_phones')) as table_size,
  pg_size_pretty(pg_total_relation_size('public.patient_phones') - pg_relation_size('public.patient_phones')) as index_size
FROM information_schema.tables 
WHERE table_name = 'patient_phones';

-- =====================================================
-- 3. FINAL STORAGE REPORT
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
-- 4. VERIFY INDEXES ARE EFFICIENT
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
-- 5. CREATE MONITORING FUNCTION
-- =====================================================

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
-- 6. SUCCESS MESSAGE
-- =====================================================

SELECT 
  'STORAGE OPTIMIZATION COMPLETE!' as status,
  'Run check_patient_phones_storage() to monitor future usage' as next_step;



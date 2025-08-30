-- 🛠️ PATIENT_PHONES STORAGE FIX - PART 1
-- Run this FIRST to drop constraints and indexes

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
-- 2. DROP CONSTRAINTS AND INDEXES
-- =====================================================

-- Drop constraints and indexes on patient_phones
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
-- NEXT STEP: Run VACUUM ANALYZE patient_phones; manually
-- =====================================================

SELECT 
  'PART 1 COMPLETE!' as status,
  'Now run: VACUUM ANALYZE patient_phones; in a new query' as next_step;




-- 🧹 Storage Cleanup and Optimization Script
-- Run this in Supabase SQL Editor to fix storage issues

-- =====================================================
-- 1. CLEAN UP PATIENT_PHONES TABLE (MAIN ISSUE)
-- =====================================================

-- First, let's see what we're dealing with
SELECT 
  'BEFORE CLEANUP' as stage,
  COUNT(*) as total_rows,
  COUNT(DISTINCT phone) as unique_phones,
  COUNT(DISTINCT patient_id) as unique_patients
FROM patient_phones;

-- Remove duplicate entries in patient_phones, keeping only the latest one per phone
DELETE FROM patient_phones 
WHERE id NOT IN (
  SELECT MAX(id)
  FROM patient_phones
  GROUP BY phone
);

-- Remove orphaned patient_phones records (no patient_id)
DELETE FROM patient_phones 
WHERE patient_id IS NULL;

-- Remove patient_phones records for non-existent patients
DELETE FROM patient_phones 
WHERE patient_id NOT IN (SELECT id FROM patients);

-- Remove patient_phones records for non-existent patients (this is the main cleanup)
DELETE FROM patient_phones 
WHERE patient_id NOT IN (SELECT id FROM patients);

-- Check results after cleanup
SELECT 
  'AFTER CLEANUP' as stage,
  COUNT(*) as total_rows,
  COUNT(DISTINCT phone) as unique_phones,
  COUNT(DISTINCT patient_id) as unique_patients
FROM patient_phones;

-- =====================================================
-- 2. OPTIMIZE INDEXES
-- =====================================================

-- Drop the large patient_phones index that's taking 18MB
DROP INDEX IF EXISTS public.patient_phones_patient_id_phone_key;

-- Create a more efficient index
CREATE INDEX IF NOT EXISTS idx_patient_phones_phone 
ON patient_phones(phone);

-- Drop the large patients name index if it's not needed
-- (Check if this index is actually used in queries)
DROP INDEX IF EXISTS public.idx_patients_name;

-- Create a more efficient index for patient searches
CREATE INDEX IF NOT EXISTS idx_patients_phone_clinic 
ON patients(phone, clinic_id);

-- =====================================================
-- 3. CLEAN UP OLD APPOINTMENTS
-- =====================================================

-- Archive old completed appointments (older than 1 year)
-- This will free up significant space
SELECT 
  'OLD_APPOINTMENTS_TO_ARCHIVE' as metric,
  COUNT(*) as count
FROM appointments 
WHERE created_at < NOW() - INTERVAL '1 year'
  AND status IN ('Completed', 'Cancelled');

-- Optional: Delete old completed appointments (uncomment if you want to delete)
-- DELETE FROM appointments 
-- WHERE created_at < NOW() - INTERVAL '1 year'
--   AND status IN ('Completed', 'Cancelled');

-- =====================================================
-- 4. VACUUM AND ANALYZE
-- =====================================================

-- Vacuum to reclaim space from deleted records
VACUUM ANALYZE;

-- =====================================================
-- 5. CHECK STORAGE AFTER CLEANUP
-- =====================================================

-- Get updated storage information
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('patient_phones', 'appointments', 'patients')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 6. PREVENT FUTURE ISSUES
-- =====================================================

-- Add a unique constraint to prevent future duplicates in patient_phones
-- (This will prevent the same phone from being added multiple times)
ALTER TABLE patient_phones 
ADD CONSTRAINT unique_phone_per_patient 
UNIQUE (phone, patient_id);

-- Add a trigger to automatically clean up orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_patient_phones()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up orphaned patient_phones when a patient is deleted
  IF TG_OP = 'DELETE' THEN
    DELETE FROM patient_phones WHERE patient_id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for patient deletion
DROP TRIGGER IF EXISTS trigger_cleanup_patient_phones ON patients;
CREATE TRIGGER trigger_cleanup_patient_phones
  AFTER DELETE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_patient_phones();

-- =====================================================
-- 7. STORAGE MONITORING FUNCTION
-- =====================================================

-- Create a function to monitor storage usage
CREATE OR REPLACE FUNCTION get_storage_usage()
RETURNS TABLE (
  table_name TEXT,
  total_size TEXT,
  table_size TEXT,
  index_size TEXT,
  row_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename))::TEXT,
    pg_size_pretty(pg_relation_size(t.schemaname||'.'||t.tablename))::TEXT,
    pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename) - pg_relation_size(t.schemaname||'.'||t.tablename))::TEXT,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.tablename)::BIGINT
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY pg_total_relation_size(t.schemaname||'.'||t.tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FINAL SUMMARY
-- =====================================================

-- Run this to see the final storage usage
SELECT * FROM get_storage_usage();

-- Check total storage saved
SELECT 
  'STORAGE_OPTIMIZATION_COMPLETE' as status,
  'Run get_storage_usage() to see results' as next_step;

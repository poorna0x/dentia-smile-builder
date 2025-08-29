-- 🔧 Fix Duplicate Indexes
-- =====================================================
-- 
-- This script fixes the duplicate index issue on dental_treatments table
-- Based on diagnostic results showing 10 indexes with potential duplicates
-- =====================================================

-- =====================================================
-- STEP 1: ANALYZE CURRENT INDEXES
-- =====================================================

-- Check the exact definitions of the potentially duplicate indexes
SELECT 
  indexname,
  indexdef,
  schemaname,
  tablename
FROM pg_indexes 
WHERE tablename = 'dental_treatments' 
  AND indexname IN ('idx_dental_treatments_patient_id', 'idx_dental_treatments_patient')
ORDER BY indexname;

-- =====================================================
-- STEP 2: CHECK INDEX COLUMNS
-- =====================================================

-- Check which columns each index covers
SELECT 
  i.relname as index_name,
  a.attname as column_name,
  a.attnum as column_position
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON ix.indexrelid = i.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'dental_treatments'
  AND i.relname IN ('idx_dental_treatments_patient_id', 'idx_dental_treatments_patient')
ORDER BY i.relname, a.attnum;

-- =====================================================
-- STEP 3: REMOVE DUPLICATE INDEX
-- =====================================================

-- Remove the less descriptive index name (keep idx_dental_treatments_patient_id)
-- The linter suggests keeping idx_dental_treatments_patient_id and removing idx_dental_treatments_patient
DROP INDEX IF EXISTS idx_dental_treatments_patient;

-- =====================================================
-- STEP 4: VERIFY FIX
-- =====================================================

-- Check remaining indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'dental_treatments'
ORDER BY indexname;

-- Count total indexes
SELECT 
  COUNT(*) as total_indexes,
  string_agg(indexname, ', ') as index_names
FROM pg_indexes 
WHERE tablename = 'dental_treatments';

-- =====================================================
-- STEP 5: OPTIMIZE OTHER INDEXES (Optional)
-- =====================================================

-- Check for other potential duplicate indexes
SELECT 
  indexname,
  indexdef,
  CASE 
    WHEN indexname LIKE '%patient%' THEN 'patient_related'
    WHEN indexname LIKE '%dentist%' THEN 'dentist_related'
    WHEN indexname LIKE '%appointment%' THEN 'appointment_related'
    WHEN indexname LIKE '%clinic%' THEN 'clinic_related'
    WHEN indexname LIKE '%status%' THEN 'status_related'
    ELSE 'other'
  END as index_category
FROM pg_indexes 
WHERE tablename = 'dental_treatments'
ORDER BY index_category, indexname;

-- Display completion message
SELECT 'Duplicate Index Fix Complete!' as status;

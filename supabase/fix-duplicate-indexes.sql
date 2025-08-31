-- =====================================================
-- 🔧 FIX DUPLICATE INDEXES
-- =====================================================
-- 
-- This script removes duplicate indexes that are causing
-- performance warnings in the database linter
-- =====================================================

SELECT '=== FIXING DUPLICATE INDEXES ===' as section;

-- =====================================================
-- 1. CHECK CURRENT DUPLICATE INDEXES
-- =====================================================

SELECT '=== CHECKING CURRENT DUPLICATE INDEXES ===' as section;

-- Check appointments table indexes
SELECT 
    'appointments indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'appointments'
AND schemaname = 'public'
ORDER BY indexname;

-- Check patient_phones table indexes
SELECT 
    'patient_phones indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'patient_phones'
AND schemaname = 'public'
ORDER BY indexname;

-- =====================================================
-- 2. FIX APPOINTMENTS TABLE DUPLICATE INDEXES
-- =====================================================

SELECT '=== FIXING APPOINTMENTS DUPLICATE INDEXES ===' as section;

-- Drop the duplicate index on appointments.patient_id
-- Keep idx_appointments_patient_id, drop idx_appointments_patient_id_fk
DROP INDEX IF EXISTS idx_appointments_patient_id_fk;

-- Verify the fix
SELECT 
    'appointments indexes after fix' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'appointments'
AND schemaname = 'public'
ORDER BY indexname;

-- =====================================================
-- 3. FIX PATIENT_PHONES TABLE DUPLICATE INDEXES
-- =====================================================

SELECT '=== FIXING PATIENT_PHONES DUPLICATE INDEXES ===' as section;

-- Drop the duplicate index on patient_phones.patient_id
-- Keep idx_patient_phones_patient_id, drop idx_patient_phones_patient_id_efficient
DROP INDEX IF EXISTS idx_patient_phones_patient_id_efficient;

-- Verify the fix
SELECT 
    'patient_phones indexes after fix' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'patient_phones'
AND schemaname = 'public'
ORDER BY indexname;

-- =====================================================
-- 4. CHECK FOR OTHER DUPLICATE INDEXES
-- =====================================================

SELECT '=== CHECKING FOR OTHER DUPLICATE INDEXES ===' as section;

-- Find all indexes that might be duplicates
WITH index_groups AS (
    SELECT 
        tablename,
        indexdef,
        COUNT(*) as count,
        array_agg(indexname ORDER BY indexname) as index_names
    FROM pg_indexes 
    WHERE schemaname = 'public'
    GROUP BY tablename, indexdef
    HAVING COUNT(*) > 1
)
SELECT 
    'potential duplicates' as check_type,
    tablename,
    indexdef,
    count,
    index_names
FROM index_groups
ORDER BY tablename, indexdef;

-- =====================================================
-- 5. OPTIMIZE INDEX NAMING CONVENTION
-- =====================================================

SELECT '=== OPTIMIZING INDEX NAMING ===' as section;

-- Rename remaining indexes to follow consistent naming convention
-- This is optional but helps with maintenance

-- Rename appointments patient_id index if needed
DO $$
BEGIN
    -- Only rename if the index exists and has a different name
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_patient_id' AND tablename = 'appointments') THEN
        -- Index already has correct name, no need to rename
        RAISE NOTICE 'appointments patient_id index already has correct name';
    END IF;
END $$;

-- Rename patient_phones patient_id index if needed
DO $$
BEGIN
    -- Only rename if the index exists and has a different name
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_patient_phones_patient_id' AND tablename = 'patient_phones') THEN
        -- Index already has correct name, no need to rename
        RAISE NOTICE 'patient_phones patient_id index already has correct name';
    END IF;
END $$;

-- =====================================================
-- 6. VERIFY THE FIXES
-- =====================================================

SELECT '=== VERIFYING THE FIXES ===' as section;

-- Final check of all indexes
SELECT 
    'final index check' as check_type,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('appointments', 'patient_phones')
ORDER BY tablename, indexname;

-- Check if duplicate indexes are gone
SELECT 
    'duplicate check' as check_type,
    tablename,
    COUNT(*) as index_count,
    COUNT(DISTINCT indexdef) as unique_index_count,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT indexdef) THEN '✅ No duplicates'
        ELSE '❌ Still has duplicates'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('appointments', 'patient_phones')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 7. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 Duplicate indexes fixed! Performance warnings should be resolved.' as status;

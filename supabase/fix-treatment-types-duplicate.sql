-- =====================================================
-- 🔧 FIX TREATMENT_TYPES DUPLICATE CONSTRAINT
-- =====================================================
-- 
-- This script checks for duplicate treatment types and helps
-- resolve the unique constraint violation
-- =====================================================

SELECT '=== FIXING TREATMENT_TYPES DUPLICATE CONSTRAINT ===' as section;

-- =====================================================
-- 1. CHECK CURRENT TREATMENT_TYPES
-- =====================================================

-- Show all treatment types
SELECT 
    'all treatment types' as data_type,
    id,
    name,
    description,
    clinic_id,
    is_active,
    created_at
FROM treatment_types 
ORDER BY name, clinic_id;

-- =====================================================
-- 2. CHECK FOR DUPLICATES
-- =====================================================

-- Find duplicate names within the same clinic
SELECT 
    'duplicate names' as check_type,
    name,
    clinic_id,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM treatment_types 
GROUP BY name, clinic_id
HAVING COUNT(*) > 1
ORDER BY name, clinic_id;

-- =====================================================
-- 3. CHECK UNIQUE CONSTRAINT
-- =====================================================

-- Check the unique constraint
SELECT 
    'unique constraint' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'treatment_types'::regclass
AND contype = 'u';

-- =====================================================
-- 4. SHOW CLINIC INFORMATION
-- =====================================================

-- Show clinic information for context
SELECT 
    'clinic info' as data_type,
    c.id,
    c.name as clinic_name,
    c.slug,
    COUNT(tt.id) as treatment_types_count
FROM clinics c
LEFT JOIN treatment_types tt ON c.id = tt.clinic_id
WHERE c.id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
GROUP BY c.id, c.name, c.slug;

-- =====================================================
-- 5. SUGGESTIONS FOR FIXING
-- =====================================================

SELECT '=== SUGGESTIONS ===' as section;

-- Show what treatment types exist for the specific clinic
SELECT 
    'existing treatment types for clinic' as data_type,
    name,
    description,
    is_active
FROM treatment_types 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
ORDER BY name;

-- =====================================================
-- 6. OPTIONS TO FIX
-- =====================================================

SELECT '=== OPTIONS TO FIX ===' as section;

SELECT 
    'option 1' as option,
    'Use a different name for the new treatment type' as description;

SELECT 
    'option 2' as option,
    'Update the existing treatment type instead of creating new' as description;

SELECT 
    'option 3' as option,
    'Delete duplicate treatment types if they exist' as description;

-- =====================================================
-- 7. CLEANUP DUPLICATES (IF NEEDED)
-- =====================================================

-- Uncomment the following section if you want to remove duplicates
/*
-- Remove duplicate treatment types (keeping the newest one)
DELETE FROM treatment_types 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY name, clinic_id ORDER BY created_at DESC) as rn
        FROM treatment_types
    ) t
    WHERE t.rn > 1
);
*/

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================

SELECT '🔍 Check the results above to see existing treatment types and duplicates. Use a unique name for new treatment types.' as status;

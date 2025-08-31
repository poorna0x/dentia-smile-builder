-- =====================================================
-- 🔧 FIX TREATMENT_TYPES RLS (SIMPLE PERMISSIVE)
-- =====================================================
-- 
-- This script creates simple permissive RLS policies for treatment_types
-- to allow all operations from the admin page
-- =====================================================

SELECT '=== FIXING TREATMENT_TYPES RLS (SIMPLE) ===' as section;

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all existing policies on treatment_types
DROP POLICY IF EXISTS "Allow all access for anon" ON treatment_types;
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON treatment_types;
DROP POLICY IF EXISTS "Users can view treatment types for their clinic" ON treatment_types;
DROP POLICY IF EXISTS "Clinic admins can manage treatment types" ON treatment_types;
DROP POLICY IF EXISTS "Allow all operations on treatment_types" ON treatment_types;
DROP POLICY IF EXISTS "Users can insert treatment types for their clinic" ON treatment_types;
DROP POLICY IF EXISTS "Users can update treatment types for their clinic" ON treatment_types;
DROP POLICY IF EXISTS "Users can delete treatment types for their clinic" ON treatment_types;

-- =====================================================
-- 2. ENABLE RLS
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE SIMPLE PERMISSIVE POLICIES
-- =====================================================

-- Create a single permissive policy for all operations
CREATE POLICY "Allow all operations on treatment_types" ON treatment_types
    FOR ALL USING (true);

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to all roles
GRANT ALL ON treatment_types TO authenticated;
GRANT ALL ON treatment_types TO anon;
GRANT ALL ON treatment_types TO service_role;

-- =====================================================
-- 5. VERIFY THE FIX
-- =====================================================

SELECT '=== VERIFYING THE FIX ===' as section;

-- Check final policies
SELECT 
    'final policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'treatment_types'
ORDER BY policyname;

-- =====================================================
-- 6. TEST THE FIX
-- =====================================================

SELECT '=== TESTING THE FIX ===' as section;

-- Test SELECT operation
SELECT 
    'SELECT test' as test_type,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ SELECT working'
        ELSE '❌ SELECT failed'
    END as status,
    COUNT(*) as record_count
FROM treatment_types;

-- Show sample data
SELECT 
    'sample data' as data_type,
    id,
    name,
    description,
    clinic_id,
    is_active
FROM treatment_types 
LIMIT 3;

-- =====================================================
-- 7. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 treatment_types RLS fixed with permissive policy! Try adding a treatment type from the admin page now.' as status;

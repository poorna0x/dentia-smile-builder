-- =====================================================
-- 🔧 FIX TREATMENT_TYPES RLS POLICIES (CORRECTED)
-- =====================================================
-- 
-- This script fixes the RLS policies for treatment_types table
-- to allow INSERT operations from the admin page
-- =====================================================

SELECT '=== FIXING TREATMENT_TYPES RLS ===' as section;

-- =====================================================
-- 1. CHECK CURRENT TREATMENT_TYPES STRUCTURE
-- =====================================================

-- Check if treatment_types table exists
SELECT 
    'treatment_types check' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'treatment_types'
    ) as table_exists;

-- Check current columns
SELECT 
    'treatment_types structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'treatment_types'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK CURRENT RLS STATUS
-- =====================================================

-- Check RLS status
SELECT 
    'RLS status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'treatment_types';

-- Check current policies
SELECT 
    'current policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'treatment_types'
ORDER BY policyname;

-- =====================================================
-- 3. FIX RLS POLICIES
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

-- Enable RLS if not already enabled
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for treatment_types
-- Policy for viewing treatment types
CREATE POLICY "Users can view treatment types for their clinic" ON treatment_types
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Policy for inserting treatment types
CREATE POLICY "Users can insert treatment types for their clinic" ON treatment_types
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Policy for updating treatment types
CREATE POLICY "Users can update treatment types for their clinic" ON treatment_types
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Policy for deleting treatment types
CREATE POLICY "Users can delete treatment types for their clinic" ON treatment_types
    FOR DELETE USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to all roles
GRANT ALL ON treatment_types TO authenticated;
GRANT ALL ON treatment_types TO anon;
GRANT ALL ON treatment_types TO service_role;

-- =====================================================
-- 5. VERIFY POLICIES ARE CREATED
-- =====================================================

SELECT '=== VERIFYING POLICIES ===' as section;

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
-- 6. TEST INSERT OPERATION
-- =====================================================

SELECT '=== TESTING INSERT OPERATION ===' as section;

-- Check if we can insert a test record (this will show the structure)
SELECT 
    'test insert structure' as test_type,
    'To test INSERT, try adding a treatment type from the admin page' as note;

-- Show sample treatment_types data (using dynamic column selection)
SELECT 
    'sample data' as data_type,
    id,
    name,
    description,
    clinic_id,
    is_active
FROM treatment_types 
LIMIT 5;

-- =====================================================
-- 7. ALTERNATIVE: CREATE PERMISSIVE POLICY
-- =====================================================

-- If the above policies don't work, we can create a permissive policy
-- Uncomment the following lines if you need a more permissive approach:

/*
-- Drop specific policies and create a permissive one
DROP POLICY IF EXISTS "Users can view treatment types for their clinic" ON treatment_types;
DROP POLICY IF EXISTS "Users can insert treatment types for their clinic" ON treatment_types;
DROP POLICY IF EXISTS "Users can update treatment types for their clinic" ON treatment_types;
DROP POLICY IF EXISTS "Users can delete treatment types for their clinic" ON treatment_types;

-- Create single permissive policy
CREATE POLICY "Allow all operations on treatment_types" ON treatment_types
    FOR ALL USING (true);
*/

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 treatment_types RLS policies fixed! Try adding a treatment type from the admin page now.' as status;

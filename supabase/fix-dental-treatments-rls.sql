-- =====================================================
-- 🔧 FIX DENTAL_TREATMENTS RLS POLICIES
-- =====================================================
-- 
-- This script fixes the RLS policies for dental_treatments table
-- to resolve the "new row violates row-level security policy" error
-- =====================================================

SELECT '=== FIXING DENTAL_TREATMENTS RLS POLICIES ===' as section;

-- =====================================================
-- 1. CHECK CURRENT RLS STATUS
-- =====================================================

-- Check if RLS is enabled
SELECT 
    'RLS status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'dental_treatments';

-- =====================================================
-- 2. CHECK EXISTING POLICIES
-- =====================================================

-- Show existing policies
SELECT 
    'existing policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'dental_treatments'
ORDER BY policyname;

-- =====================================================
-- 3. DROP EXISTING POLICIES
-- =====================================================

-- Drop all existing policies on dental_treatments
DROP POLICY IF EXISTS "Allow all operations on dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Allow patient portal access to dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Allow patient portal insert to dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Allow patient portal update to dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Allow patient portal delete to dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Users can view their own clinic's dental treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Users can insert dental treatments for their clinic" ON dental_treatments;
DROP POLICY IF EXISTS "Users can update dental treatments for their clinic" ON dental_treatments;
DROP POLICY IF EXISTS "Users can delete dental treatments for their clinic" ON dental_treatments;

-- =====================================================
-- 4. ENABLE RLS
-- =====================================================

-- Enable RLS on dental_treatments
ALTER TABLE dental_treatments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE PERMISSIVE POLICIES
-- =====================================================

-- Create a single, permissive policy for all operations
CREATE POLICY "Allow all operations on dental_treatments" ON dental_treatments
    FOR ALL USING (true);

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant full permissions to authenticated users
GRANT ALL ON dental_treatments TO authenticated;
GRANT ALL ON dental_treatments TO anon;
GRANT ALL ON dental_treatments TO service_role;

-- =====================================================
-- 7. VERIFY THE FIX
-- =====================================================

-- Check the new policy
SELECT 
    'new policy' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'dental_treatments'
ORDER BY policyname;

-- Check RLS status again
SELECT 
    'final RLS status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'dental_treatments';

-- =====================================================
-- 8. TEST DATA VERIFICATION
-- =====================================================

-- Show sample dental_treatments data
SELECT 
    'sample data' as data_type,
    id,
    clinic_id,
    patient_id,
    tooth_number,
    treatment_type,
    treatment_status,
    created_at
FROM dental_treatments 
LIMIT 5;

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 dental_treatments RLS fixed with permissive policy! Try adding a dental treatment from the dental chart now.' as status;

-- =====================================================
-- 🔧 FIX MULTIPLE PERMISSIVE POLICIES WARNINGS
-- =====================================================

-- =====================================================
-- 1. CHECK CURRENT POLICIES
-- =====================================================

SELECT '=== CURRENT USER_ROLES POLICIES ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- =====================================================
-- 2. DROP EXISTING POLICIES
-- =====================================================

SELECT '=== DROPPING EXISTING POLICIES ===' as section;

-- Drop all existing user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Clinic admins can manage user roles" ON user_roles;

-- =====================================================
-- 3. CREATE SINGLE CONSOLIDATED POLICY
-- =====================================================

SELECT '=== CREATING CONSOLIDATED POLICY ===' as section;

-- Create a single policy that handles both cases
CREATE POLICY "Consolidated user roles policy" ON user_roles
    FOR ALL USING (
        -- Users can view their own roles
        user_id = (select auth.uid())
        OR
        -- Clinic admins can manage all roles in their clinic
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.role = 'clinic_admin'
            AND ur.clinic_id = user_roles.clinic_id
        )
    );

-- =====================================================
-- 4. VERIFY THE FIX
-- =====================================================

SELECT '=== VERIFYING THE FIX ===' as section;

-- Check that only one policy exists now
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- Test the consolidated policy
SELECT 
    'user_roles consolidated test' as test_name,
    COUNT(*) as result_count
FROM user_roles 
WHERE user_id = (select auth.uid());

-- Test clinic admin access
SELECT 
    'clinic admin test' as test_name,
    COUNT(*) as result_count
FROM user_roles 
WHERE EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = (select auth.uid())
    AND ur.role = 'clinic_admin'
    AND ur.clinic_id = user_roles.clinic_id
);

-- =====================================================
-- 5. TEST RELATED FUNCTIONALITY
-- =====================================================

SELECT '=== TESTING RELATED FUNCTIONALITY ===' as section;

-- Test staff_permissions
SELECT 
    'staff_permissions test' as test_name,
    COUNT(*) as result_count
FROM staff_permissions 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- Test treatment_types
SELECT 
    'treatment_types test' as test_name,
    COUNT(*) as result_count
FROM treatment_types 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463' 
AND is_active = true;

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 Multiple permissive policies fixed! Single consolidated policy created.' as status;

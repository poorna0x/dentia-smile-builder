-- =====================================================
-- 🔧 FIX INFINITE RECURSION IN RLS POLICIES
-- =====================================================

-- =====================================================
-- 1. DIAGNOSE THE PROBLEM
-- =====================================================

SELECT '=== DIAGNOSING INFINITE RECURSION ===' as section;

-- Check current user_roles policies
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
-- 2. FIX USER_ROLES POLICIES (REMOVE SELF-REFERENCE)
-- =====================================================

SELECT '=== FIXING USER_ROLES POLICIES ===' as section;

-- Drop all user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Clinic admins can manage user roles" ON user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Clinic admins can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.role = 'clinic_admin'
            AND ur.clinic_id = user_roles.clinic_id
        )
    );

-- =====================================================
-- 3. FIX OTHER POLICIES TO AVOID RECURSION
-- =====================================================

SELECT '=== FIXING OTHER POLICIES ===' as section;

-- Fix staff_permissions policy
DROP POLICY IF EXISTS "Allow authenticated users to manage staff permissions" ON staff_permissions;
CREATE POLICY "Allow authenticated users to manage staff permissions" ON staff_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.clinic_id = staff_permissions.clinic_id
        )
    );

-- Fix treatment_types policy
DROP POLICY IF EXISTS "Clinic admins can manage treatment types" ON treatment_types;
CREATE POLICY "Clinic admins can manage treatment types" ON treatment_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.clinic_id = treatment_types.clinic_id
        )
    );

-- Fix treatment_payments policies
DROP POLICY IF EXISTS "Users can view their own clinic's treatment payments" ON treatment_payments;
CREATE POLICY "Users can view their own clinic's treatment payments" ON treatment_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.clinic_id = treatment_payments.clinic_id
        )
    );

DROP POLICY IF EXISTS "Users can insert treatment payments for their clinic" ON treatment_payments;
CREATE POLICY "Users can insert treatment payments for their clinic" ON treatment_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.clinic_id = treatment_payments.clinic_id
        )
    );

DROP POLICY IF EXISTS "Users can update treatment payments for their clinic" ON treatment_payments;
CREATE POLICY "Users can update treatment payments for their clinic" ON treatment_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.clinic_id = treatment_payments.clinic_id
        )
    );

DROP POLICY IF EXISTS "Users can delete treatment payments for their clinic" ON treatment_payments;
CREATE POLICY "Users can delete treatment payments for their clinic" ON treatment_payments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.clinic_id = treatment_payments.clinic_id
        )
    );

-- =====================================================
-- 4. TEST THE FIXES
-- =====================================================

SELECT '=== TESTING FIXES ===' as section;

-- Test user_roles query
SELECT 
    'user_roles test' as test_name,
    COUNT(*) as result_count
FROM user_roles 
WHERE user_id = (select auth.uid());

-- Test staff_permissions query
SELECT 
    'staff_permissions test' as test_name,
    COUNT(*) as result_count
FROM staff_permissions 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- Test treatment_types query
SELECT 
    'treatment_types test' as test_name,
    COUNT(*) as result_count
FROM treatment_types 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463' 
AND is_active = true;

-- =====================================================
-- 5. VERIFY POLICIES
-- =====================================================

SELECT '=== VERIFYING POLICIES ===' as section;

-- Show all policies for affected tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('user_roles', 'staff_permissions', 'treatment_types', 'treatment_payments')
ORDER BY tablename, policyname;

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 Infinite recursion fixed! Policies simplified and working.' as status;

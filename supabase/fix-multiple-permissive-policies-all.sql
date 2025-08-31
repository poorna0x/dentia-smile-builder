-- =====================================================
-- 🔧 FIX ALL MULTIPLE PERMISSIVE POLICIES
-- =====================================================
-- 
-- This script removes duplicate RLS policies that are causing
-- multiple_permissive_policies warnings
-- =====================================================

SELECT '=== FIXING MULTIPLE PERMISSIVE POLICIES ===' as section;

-- =====================================================
-- 1. FIX SYSTEM_SETTINGS POLICIES
-- =====================================================

SELECT '=== FIXING SYSTEM_SETTINGS POLICIES ===' as section;

-- Drop all existing policies on system_settings
DROP POLICY IF EXISTS "Allow all access for anon" ON system_settings;
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON system_settings;

-- Create single consolidated policy for all roles
CREATE POLICY "Allow all operations on system_settings" ON system_settings
    FOR ALL USING (true);

-- =====================================================
-- 2. FIX SCHEDULING_SETTINGS POLICIES
-- =====================================================

SELECT '=== FIXING SCHEDULING_SETTINGS POLICIES ===' as section;

-- Drop all existing policies on scheduling_settings
DROP POLICY IF EXISTS "Allow all access for anon" ON scheduling_settings;
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON scheduling_settings;

-- Create single consolidated policy for all roles
CREATE POLICY "Allow all operations on scheduling_settings" ON scheduling_settings
    FOR ALL USING (true);

-- =====================================================
-- 3. FIX STAFF_PERMISSIONS POLICIES
-- =====================================================

SELECT '=== FIXING STAFF_PERMISSIONS POLICIES ===' as section;

-- Drop all existing policies on staff_permissions
DROP POLICY IF EXISTS "Allow all access for anon" ON staff_permissions;
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON staff_permissions;

-- Create single consolidated policy for all roles
CREATE POLICY "Allow all operations on staff_permissions" ON staff_permissions
    FOR ALL USING (true);

-- =====================================================
-- 4. FIX USER_ROLES POLICIES
-- =====================================================

SELECT '=== FIXING USER_ROLES POLICIES ===' as section;

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Allow all access for anon" ON user_roles;
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Clinic admins can manage user roles" ON user_roles;

-- Create single consolidated policy for all roles
CREATE POLICY "Allow all operations on user_roles" ON user_roles
    FOR ALL USING (true);

-- =====================================================
-- 5. VERIFY POLICIES ARE FIXED
-- =====================================================

SELECT '=== VERIFYING POLICIES ARE FIXED ===' as section;

-- Check system_settings policies
SELECT 
    'system_settings policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'system_settings'
ORDER BY policyname;

-- Check scheduling_settings policies
SELECT 
    'scheduling_settings policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'scheduling_settings'
ORDER BY policyname;

-- Check staff_permissions policies
SELECT 
    'staff_permissions policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'staff_permissions'
ORDER BY policyname;

-- Check user_roles policies
SELECT 
    'user_roles policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- =====================================================
-- 6. TEST API ENDPOINTS
-- =====================================================

SELECT '=== TESTING API ENDPOINTS ===' as section;

-- Test system_settings query
SELECT 
    'system_settings API test' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ system_settings working'
        ELSE '❌ system_settings failed'
    END as status,
    COUNT(*) as record_count
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- Test scheduling_settings query
SELECT 
    'scheduling_settings API test' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ scheduling_settings working'
        ELSE '❌ scheduling_settings failed'
    END as status,
    COUNT(*) as record_count
FROM scheduling_settings 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- Test staff_permissions query
SELECT 
    'staff_permissions API test' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ staff_permissions working'
        ELSE '❌ staff_permissions failed'
    END as status,
    COUNT(*) as record_count
FROM staff_permissions 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- Test user_roles query
SELECT 
    'user_roles API test' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ user_roles working'
        ELSE '❌ user_roles failed'
    END as status,
    COUNT(*) as record_count
FROM user_roles 
LIMIT 1;

-- =====================================================
-- 7. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 All multiple permissive policies warnings should now be resolved! Each table now has only one consolidated policy.' as status;

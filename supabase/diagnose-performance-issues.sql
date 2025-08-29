-- 🔍 Diagnose Performance Issues
-- =====================================================
-- 
-- This script checks the current state of policies and indexes
-- to understand what needs to be fixed
-- =====================================================

-- =====================================================
-- CHECK DENTAL_TREATMENTS POLICIES
-- =====================================================

SELECT '=== DENTAL_TREATMENTS POLICIES ===' as section;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'dental_treatments'
ORDER BY policyname, cmd;

-- =====================================================
-- CHECK USER_ROLES POLICIES
-- =====================================================

SELECT '=== USER_ROLES POLICIES ===' as section;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname, cmd;

-- =====================================================
-- CHECK SECURITY TABLES POLICIES
-- =====================================================

SELECT '=== SECURITY AUDIT LOG POLICIES ===' as section;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'security_audit_log'
ORDER BY policyname, cmd;

SELECT '=== LOGIN ATTEMPTS POLICIES ===' as section;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'login_attempts'
ORDER BY policyname, cmd;

SELECT '=== CAPTCHA ATTEMPTS POLICIES ===' as section;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'captcha_attempts'
ORDER BY policyname, cmd;

SELECT '=== STAFF PERMISSIONS POLICIES ===' as section;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'staff_permissions'
ORDER BY policyname, cmd;

-- =====================================================
-- CHECK INDEXES
-- =====================================================

SELECT '=== DENTAL_TREATMENTS INDEXES ===' as section;

SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'dental_treatments'
ORDER BY indexname;

-- =====================================================
-- SUMMARY STATISTICS
-- =====================================================

SELECT '=== SUMMARY ===' as section;

-- Count policies by table
SELECT 
  tablename,
  COUNT(*) as policy_count,
  COUNT(DISTINCT cmd) as unique_operations,
  COUNT(DISTINCT roles) as unique_roles
FROM pg_policies 
WHERE tablename IN ('dental_treatments', 'user_roles', 'security_audit_log', 'login_attempts', 'captcha_attempts', 'staff_permissions')
GROUP BY tablename
ORDER BY tablename;

-- Count indexes by table
SELECT 
  tablename,
  COUNT(*) as index_count,
  string_agg(indexname, ', ') as index_names
FROM pg_indexes 
WHERE tablename IN ('dental_treatments', 'user_roles', 'security_audit_log', 'login_attempts', 'captcha_attempts', 'staff_permissions')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 🔧 FIX MULTIPLE PERMISSIVE POLICIES
-- =====================================================
-- 
-- This script fixes the specific multiple permissive policy warnings
-- by removing duplicate policies and keeping only the essential ones
-- =====================================================

SELECT '=== FIXING MULTIPLE PERMISSIVE POLICIES ===' as section;

-- =====================================================
-- 1. FIX PAYMENT_TRANSACTIONS TABLE
-- =====================================================

SELECT '=== FIXING PAYMENT_TRANSACTIONS POLICIES ===' as section;

-- Drop the duplicate "Allow all for anon" and "Allow all for authenticated" policies
-- Keep only "Allow all operations on payment_transactions"

-- Drop anon policies
DROP POLICY IF EXISTS "Allow all for anon" ON payment_transactions;

-- Drop authenticated policies  
DROP POLICY IF EXISTS "Allow all for authenticated" ON payment_transactions;

-- Verify only one policy remains
SELECT 
    'payment_transactions policies after fix' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'payment_transactions'
ORDER BY policyname;

-- =====================================================
-- 2. FIX TREATMENT_PAYMENTS TABLE
-- =====================================================

SELECT '=== FIXING TREATMENT_PAYMENTS POLICIES ===' as section;

-- Drop the duplicate "Allow all for anon" and "Allow all for authenticated" policies
-- Keep only "Allow all operations on treatment_payments"

-- Drop anon policies
DROP POLICY IF EXISTS "Allow all for anon" ON treatment_payments;

-- Drop authenticated policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON treatment_payments;

-- Verify only one policy remains
SELECT 
    'treatment_payments policies after fix' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'treatment_payments'
ORDER BY policyname;

-- =====================================================
-- 3. FIX USER_ROLES TABLE
-- =====================================================

SELECT '=== FIXING USER_ROLES POLICIES ===' as section;

-- Drop the duplicate "Simple user roles policy" 
-- Keep "Allow all operations on user_roles" and "Users can view their own roles"

-- Drop the duplicate policy
DROP POLICY IF EXISTS "Simple user roles policy" ON user_roles;

-- Verify remaining policies
SELECT 
    'user_roles policies after fix' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- =====================================================
-- 4. VERIFY ALL FIXES
-- =====================================================

SELECT '=== VERIFYING ALL FIXES ===' as section;

-- Check for any remaining multiple permissive policies
WITH policy_counts AS (
    SELECT 
        schemaname,
        tablename,
        roles,
        cmd,
        COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND permissive = 'PERMISSIVE'
    GROUP BY schemaname, tablename, roles, cmd
    HAVING COUNT(*) > 1
)
SELECT 
    'remaining multiple policies' as check_type,
    tablename,
    roles,
    cmd,
    policy_count
FROM policy_counts
ORDER BY tablename, roles, cmd;

-- Final policy summary
SELECT 
    'final policy summary' as check_type,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN permissive = 'PERMISSIVE' THEN 1 END) as permissive_policies,
    string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('payment_transactions', 'treatment_payments', 'user_roles')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 5. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 Multiple permissive policies fixed! Performance warnings should be resolved.' as status;

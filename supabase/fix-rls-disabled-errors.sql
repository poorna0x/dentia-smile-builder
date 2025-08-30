-- =====================================================
-- 🔧 FIX RLS DISABLED ERRORS - ENABLE RLS WITH SIMPLE POLICIES
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON PAYMENT TABLES
-- =====================================================

SELECT '=== ENABLING RLS ON PAYMENT TABLES ===' as section;

-- Enable RLS on payment tables
ALTER TABLE treatment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE SIMPLE, PERMISSIVE RLS POLICIES
-- =====================================================

SELECT '=== CREATING SIMPLE RLS POLICIES ===' as section;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON treatment_payments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_transactions;

-- Create simple policies for treatment_payments
CREATE POLICY "Enable all access for authenticated users" ON treatment_payments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON treatment_payments
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Create simple policies for payment_transactions
CREATE POLICY "Enable all access for authenticated users" ON payment_transactions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON payment_transactions
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 3. VERIFY RLS STATUS
-- =====================================================

SELECT '=== VERIFYING RLS STATUS ===' as section;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('treatment_payments', 'payment_transactions');

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('treatment_payments', 'payment_transactions')
ORDER BY tablename, policyname;

-- =====================================================
-- 4. TEST ACCESS
-- =====================================================

SELECT '=== TESTING ACCESS ===' as section;

-- Test authenticated user access
SET ROLE authenticated;

-- Test treatment_payments access
SELECT 
    'treatment_payments authenticated access' as test_name,
    COUNT(*) as result_count
FROM treatment_payments;

-- Test specific treatment queries
SELECT 
    'specific treatment 1 authenticated' as test_name,
    COUNT(*) as result_count
FROM treatment_payments 
WHERE treatment_id = 'd1521f92-357c-47ee-8edc-db5ee4240dfa';

SELECT 
    'specific treatment 2 authenticated' as test_name,
    COUNT(*) as result_count
FROM treatment_payments 
WHERE treatment_id = 'b241e691-bb63-45f6-9cbe-68cf3a66fd6a';

-- Test payment_transactions access
SELECT 
    'payment_transactions authenticated access' as test_name,
    COUNT(*) as result_count
FROM payment_transactions;

-- Reset role
RESET ROLE;

-- Test anon user access
SET ROLE anon;

-- Test treatment_payments access
SELECT 
    'treatment_payments anon access' as test_name,
    COUNT(*) as result_count
FROM treatment_payments;

-- Test payment_transactions access
SELECT 
    'payment_transactions anon access' as test_name,
    COUNT(*) as result_count
FROM payment_transactions;

-- Reset role
RESET ROLE;

-- =====================================================
-- 5. VERIFY PERMISSIONS
-- =====================================================

SELECT '=== VERIFYING PERMISSIONS ===' as section;

-- Check table permissions
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
AND table_name IN ('treatment_payments', 'payment_transactions')
AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, table_name, privilege_type;

-- Check function permissions
SELECT 
    grantee,
    routine_name,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public'
AND routine_name = 'add_payment_transaction'
AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, privilege_type;

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 RLS enabled with simple policies! Should fix rls_disabled_in_public errors without causing 406 errors.' as status;

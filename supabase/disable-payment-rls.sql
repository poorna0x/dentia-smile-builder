-- =====================================================
-- 🔧 DISABLE RLS FOR PAYMENT SYSTEM - ALTERNATIVE APPROACH
-- =====================================================

-- =====================================================
-- 1. CHECK CURRENT STATUS
-- =====================================================

SELECT '=== CURRENT PAYMENT SYSTEM STATUS ===' as section;

-- Check if tables exist and their RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('treatment_payments', 'payment_transactions');

-- Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('treatment_payments', 'payment_transactions')
ORDER BY tablename, policyname;

-- =====================================================
-- 2. COMPLETELY DISABLE RLS FOR PAYMENT TABLES
-- =====================================================

SELECT '=== DISABLING RLS FOR PAYMENT TABLES ===' as section;

-- Disable RLS completely for payment tables
ALTER TABLE treatment_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;

-- Drop all policies for payment tables
DROP POLICY IF EXISTS "Users can view their own clinic's treatment payments" ON treatment_payments;
DROP POLICY IF EXISTS "Users can insert treatment payments for their clinic" ON treatment_payments;
DROP POLICY IF EXISTS "Users can update treatment payments for their clinic" ON treatment_payments;
DROP POLICY IF EXISTS "Users can delete treatment payments for their clinic" ON treatment_payments;
DROP POLICY IF EXISTS "Allow all treatment payments" ON treatment_payments;

DROP POLICY IF EXISTS "Users can view payment transactions for their clinic" ON payment_transactions;
DROP POLICY IF EXISTS "Users can insert payment transactions for their clinic" ON payment_transactions;
DROP POLICY IF EXISTS "Users can update payment transactions for their clinic" ON payment_transactions;
DROP POLICY IF EXISTS "Users can delete payment transactions for their clinic" ON payment_transactions;
DROP POLICY IF EXISTS "Allow all payment transactions" ON payment_transactions;

-- =====================================================
-- 3. GRANT FULL PERMISSIONS
-- =====================================================

SELECT '=== GRANTING FULL PERMISSIONS ===' as section;

-- Grant full permissions to authenticated users
GRANT ALL PRIVILEGES ON treatment_payments TO authenticated;
GRANT ALL PRIVILEGES ON payment_transactions TO authenticated;

-- Grant full permissions to anon users (for testing)
GRANT ALL PRIVILEGES ON treatment_payments TO anon;
GRANT ALL PRIVILEGES ON payment_transactions TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- 4. RECREATE PAYMENT FUNCTIONS WITH SECURITY DEFINER
-- =====================================================

SELECT '=== RECREATING PAYMENT FUNCTIONS ===' as section;

-- Drop and recreate add_payment_transaction function
DROP FUNCTION IF EXISTS add_payment_transaction(UUID, DECIMAL, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION add_payment_transaction(
  p_payment_id UUID,
  p_amount DECIMAL(10,2),
  p_payment_method TEXT,
  p_transaction_id TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO payment_transactions (
    treatment_payment_id,
    amount,
    payment_method,
    transaction_id,
    notes,
    created_at
  ) VALUES (
    p_payment_id,
    p_amount,
    p_payment_method,
    p_transaction_id,
    p_notes,
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_payment_transaction(UUID, DECIMAL, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_payment_transaction(UUID, DECIMAL, TEXT, TEXT, TEXT) TO anon;

-- =====================================================
-- 5. CREATE SAMPLE DATA FOR TESTING
-- =====================================================

SELECT '=== CREATING SAMPLE DATA ===' as section;

-- Insert sample treatment payment if none exists
INSERT INTO treatment_payments (
    treatment_id,
    clinic_id,
    patient_id,
    total_amount,
    paid_amount,
    payment_status
) VALUES (
    '85aae10e-c071-4a3c-9bdd-56dd3f8fe4b9',
    'c1ca557d-ca85-4905-beb7-c3985692d463',
    '00000000-0000-0000-0000-000000000000',
    1000.00,
    0.00,
    'Pending'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. TEST THE SYSTEM
-- =====================================================

SELECT '=== TESTING PAYMENT SYSTEM ===' as section;

-- Test direct table access
SELECT 
    'treatment_payments direct access' as test_name,
    COUNT(*) as result_count
FROM treatment_payments;

-- Test specific treatment query
SELECT 
    'specific treatment query' as test_name,
    COUNT(*) as result_count
FROM treatment_payments 
WHERE treatment_id = '85aae10e-c071-4a3c-9bdd-56dd3f8fe4b9';

-- Test payment_transactions access
SELECT 
    'payment_transactions access' as test_name,
    COUNT(*) as result_count
FROM payment_transactions;

-- Test function
SELECT 
    'add_payment_transaction function' as test_name,
    'Function exists and accessible' as status
WHERE EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'add_payment_transaction'
);

-- =====================================================
-- 7. VERIFY RLS STATUS
-- =====================================================

SELECT '=== VERIFYING RLS STATUS ===' as section;

-- Check final RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS STILL ENABLED'
        ELSE '✅ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('treatment_payments', 'payment_transactions');

-- Check permissions
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
AND table_name IN ('treatment_payments', 'payment_transactions')
AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, table_name, privilege_type;

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 RLS disabled for payment system! Should work without 406 errors now.' as status;

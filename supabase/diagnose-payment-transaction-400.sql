-- =====================================================
-- 🔧 DIAGNOSE PAYMENT TRANSACTION 400 ERROR
-- =====================================================

-- =====================================================
-- 1. CHECK TABLE STRUCTURE
-- =====================================================

SELECT '=== CHECKING TABLE STRUCTURE ===' as section;

-- Check treatment_payments structure
SELECT 
    'treatment_payments structure' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'treatment_payments'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check payment_transactions structure
SELECT 
    'payment_transactions structure' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_transactions'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK SAMPLE DATA
-- =====================================================

SELECT '=== CHECKING SAMPLE DATA ===' as section;

-- Check treatment_payments sample data
SELECT 
    'treatment_payments sample' as table_name,
    id,
    treatment_id,
    clinic_id,
    total_amount,
    paid_amount,
    payment_status
FROM treatment_payments 
LIMIT 5;

-- Check payment_transactions sample data
SELECT 
    'payment_transactions sample' as table_name,
    id,
    treatment_payment_id,
    amount,
    payment_method,
    transaction_id,
    payment_date
FROM payment_transactions 
LIMIT 5;

-- =====================================================
-- 3. CHECK RLS AND POLICIES
-- =====================================================

SELECT '=== CHECKING RLS AND POLICIES ===' as section;

-- Check RLS status
SELECT 
    'RLS status' as check_type,
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
    'Policies' as check_type,
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
-- 4. CHECK PERMISSIONS
-- =====================================================

SELECT '=== CHECKING PERMISSIONS ===' as section;

-- Check table permissions
SELECT 
    'Table permissions' as check_type,
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
    'Function permissions' as check_type,
    grantee,
    routine_name,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public'
AND routine_name = 'add_payment_transaction'
AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, privilege_type;

-- =====================================================
-- 5. TEST MANUAL INSERT
-- =====================================================

SELECT '=== TESTING MANUAL INSERT ===' as section;

-- Test as authenticated user
SET ROLE authenticated;

-- Try to insert a test payment transaction
DO $$
DECLARE
    v_payment_id UUID;
    v_transaction_id UUID;
BEGIN
    -- Get a payment ID to use
    SELECT id INTO v_payment_id 
    FROM treatment_payments 
    LIMIT 1;
    
    IF v_payment_id IS NOT NULL THEN
        -- Try to insert a transaction
        INSERT INTO payment_transactions (
            treatment_payment_id,
            amount,
            payment_method,
            transaction_id,
            notes,
            payment_date
        ) VALUES (
            v_payment_id,
            100.00,
            'Cash',
            'TEST-001',
            'Test transaction',
            CURRENT_DATE
        ) RETURNING id INTO v_transaction_id;
        
        RAISE NOTICE 'Successfully inserted transaction with ID: %', v_transaction_id;
        
        -- Clean up
        DELETE FROM payment_transactions WHERE id = v_transaction_id;
    ELSE
        RAISE NOTICE 'No payment records found to test with';
    END IF;
END $$;

RESET ROLE;

-- =====================================================
-- 6. TEST FUNCTION CALL
-- =====================================================

SELECT '=== TESTING FUNCTION CALL ===' as section;

-- Test the add_payment_transaction function
DO $$
DECLARE
    v_payment_id UUID;
    v_transaction_id UUID;
BEGIN
    -- Get a payment ID to use
    SELECT id INTO v_payment_id 
    FROM treatment_payments 
    LIMIT 1;
    
    IF v_payment_id IS NOT NULL THEN
        -- Try to call the function
        SELECT add_payment_transaction(
            v_payment_id,
            100.00,
            'Cash',
            'TEST-FUNC-001',
            'Test function call'
        ) INTO v_transaction_id;
        
        RAISE NOTICE 'Function call successful, transaction ID: %', v_transaction_id;
        
        -- Clean up
        DELETE FROM payment_transactions WHERE id = v_transaction_id;
    ELSE
        RAISE NOTICE 'No payment records found to test function with';
    END IF;
END $$;

-- =====================================================
-- 7. CHECK FOR CONSTRAINTS
-- =====================================================

SELECT '=== CHECKING CONSTRAINTS ===' as section;

-- Check constraints on payment_transactions
SELECT 
    'payment_transactions constraints' as table_name,
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public'
AND constraint_name LIKE '%payment_transactions%';

-- Check foreign key constraints
SELECT 
    'Foreign key constraints' as check_type,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'payment_transactions';

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 Payment transaction 400 error diagnosis complete! Check the results above for issues.' as status;

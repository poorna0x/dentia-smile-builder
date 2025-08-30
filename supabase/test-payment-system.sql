-- =====================================================
-- 🔧 TEST PAYMENT SYSTEM - VERIFY EVERYTHING WORKS
-- =====================================================

-- =====================================================
-- 1. CHECK TABLE STRUCTURE
-- =====================================================

SELECT '=== CHECKING TABLE STRUCTURE ===' as section;

-- Check treatment_payments structure
SELECT 
    'treatment_payments' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'treatment_payments'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check payment_transactions structure
SELECT 
    'payment_transactions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK RLS AND POLICIES
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
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('treatment_payments', 'payment_transactions')
ORDER BY tablename, policyname;

-- =====================================================
-- 3. CHECK SAMPLE DATA
-- =====================================================

SELECT '=== CHECKING SAMPLE DATA ===' as section;

-- Check treatment_payments data
SELECT 
    'treatment_payments data' as table_name,
    COUNT(*) as record_count
FROM treatment_payments;

-- Check payment_transactions data
SELECT 
    'payment_transactions data' as table_name,
    COUNT(*) as record_count
FROM payment_transactions;

-- Show sample treatment payments
SELECT 
    'Sample treatment payments' as info,
    id,
    treatment_id,
    total_amount,
    paid_amount,
    payment_status
FROM treatment_payments 
LIMIT 3;

-- =====================================================
-- 4. TEST API ACCESS
-- =====================================================

SELECT '=== TESTING API ACCESS ===' as section;

-- Test as authenticated user
SET ROLE authenticated;

-- Test treatment_payments access
SELECT 
    'Authenticated treatment_payments access' as test_name,
    COUNT(*) as record_count
FROM treatment_payments;

-- Test payment_transactions access
SELECT 
    'Authenticated payment_transactions access' as test_name,
    COUNT(*) as record_count
FROM payment_transactions;

-- Test specific treatment query (like the 406 error)
SELECT 
    'Specific treatment query test' as test_name,
    COUNT(*) as record_count
FROM treatment_payments 
WHERE treatment_id IN (
    '3f0562bc-a3aa-4285-b752-d9f542a9ee49',
    '1914daf7-ca11-46c9-913e-9e64c9f75af5'
);

RESET ROLE;

-- Test as anon user
SET ROLE anon;

-- Test treatment_payments access
SELECT 
    'Anon treatment_payments access' as test_name,
    COUNT(*) as record_count
FROM treatment_payments;

-- Test payment_transactions access
SELECT 
    'Anon payment_transactions access' as test_name,
    COUNT(*) as record_count
FROM payment_transactions;

RESET ROLE;

-- =====================================================
-- 5. TEST FUNCTION CALLS
-- =====================================================

SELECT '=== TESTING FUNCTION CALLS ===' as section;

-- Test add_payment_transaction function
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
            'TEST-001',
            'Test function call'
        ) INTO v_transaction_id;
        
        RAISE NOTICE '✅ Function call successful, transaction ID: %', v_transaction_id;
        
        -- Clean up
        DELETE FROM payment_transactions WHERE id = v_transaction_id;
        RAISE NOTICE '✅ Test transaction cleaned up';
    ELSE
        RAISE NOTICE '⚠️ No payment records found to test function with';
    END IF;
END $$;

-- =====================================================
-- 6. TEST MANUAL INSERT
-- =====================================================

SELECT '=== TESTING MANUAL INSERT ===' as section;

-- Test manual insert as authenticated user
SET ROLE authenticated;

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
            50.00,
            'UPI',
            'TEST-MANUAL-001',
            'Test manual insert',
            CURRENT_DATE
        ) RETURNING id INTO v_transaction_id;
        
        RAISE NOTICE '✅ Manual insert successful, transaction ID: %', v_transaction_id;
        
        -- Clean up
        DELETE FROM payment_transactions WHERE id = v_transaction_id;
        RAISE NOTICE '✅ Test transaction cleaned up';
    ELSE
        RAISE NOTICE '⚠️ No payment records found to test manual insert with';
    END IF;
END $$;

RESET ROLE;

-- =====================================================
-- 7. SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 Payment system test complete! If all tests passed, the 400 errors should be resolved.' as status;

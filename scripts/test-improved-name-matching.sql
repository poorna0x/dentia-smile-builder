-- =====================================================
-- 🧪 TEST IMPROVED NAME MATCHING
-- =====================================================
-- 
-- Test the improved name matching logic
-- Run this to verify everything is working
-- =====================================================

-- Test 1: Check if functions exist
SELECT 'Checking if functions exist:' as info;

SELECT 
    proname as function_name,
    CASE WHEN proname = 'find_or_create_patient_improved' THEN '✅ Improved function' 
         WHEN proname = 'is_same_person' THEN '✅ Same person checker'
         WHEN proname = 'extract_first_name' THEN '✅ Name extractor'
         ELSE '❌ Unknown function' END as status
FROM pg_proc 
WHERE proname IN ('find_or_create_patient_improved', 'is_same_person', 'extract_first_name');

-- Test 2: Test name extraction
SELECT 'Testing name extraction:' as info;

SELECT 
    'J Poorna' as input_name,
    extract_first_name('J Poorna') as extracted_first_name
UNION ALL
SELECT 
    'Dr. John Smith',
    extract_first_name('Dr. John Smith')
UNION ALL
SELECT 
    'Poorna Shetty',
    extract_first_name('Poorna Shetty')
UNION ALL
SELECT 
    'Poo Shetty',
    extract_first_name('Poo Shetty');

-- Test 3: Test same person detection
SELECT 'Testing same person detection:' as info;

SELECT 
    'J Poorna vs Poorna Shetty' as test_case,
    is_same_person('J', 'Poorna', 'Poorna Shetty') as is_match
UNION ALL
SELECT 
    'Poorna vs Poorna Shetty',
    is_same_person('Poorna', NULL, 'Poorna Shetty')
UNION ALL
SELECT 
    'John Doe vs Jane Doe',
    is_same_person('John', 'Doe', 'Jane Doe')
UNION ALL
SELECT 
    'Poorna vs Poo Shetty',
    is_same_person('Poorna', NULL, 'Poo Shetty')
UNION ALL
SELECT 
    'Dr. John vs John Smith',
    is_same_person('John', NULL, 'Dr. John Smith');

-- Test 4: Test the complete function (if you have test data)
SELECT 'Testing complete function (if test data exists):' as info;

-- This will only work if you have existing patients to test with
-- Replace the phone number with one that exists in your database
SELECT 
    'Testing with existing phone' as test_case,
    find_or_create_patient_improved('Poorna Shetty', '9876543210', 'test@example.com', 'c1ca557d-ca85-4905-beb7-c3985692d463') as patient_id;

-- Test 5: Check trigger status
SELECT 'Checking trigger status:' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    CASE WHEN trigger_name = 'auto_link_appointment_trigger' THEN '✅ Active' ELSE '❌ Missing' END as status
FROM information_schema.triggers 
WHERE trigger_name = 'auto_link_appointment_trigger';

-- =====================================================
-- ✅ TEST SUMMARY
-- =====================================================
-- 
-- If all tests pass:
-- ✅ Functions exist and are working
-- ✅ Name extraction is correct
-- ✅ Same person detection is working
-- ✅ Trigger is active
-- 
-- Now you can test with real appointment bookings!
-- 
-- =====================================================

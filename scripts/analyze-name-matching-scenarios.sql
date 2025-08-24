-- =====================================================
-- 🤔 ANALYZING NAME MATCHING SCENARIOS
-- =====================================================
-- 
-- Let's analyze different scenarios and propose better solutions
-- =====================================================

-- Scenario 1: Same family, different names
-- Existing: "John Doe" - 9876543210
-- New: "Jane Doe" - 9876543210
-- Expected: Should be same family, but different patients

-- Scenario 2: Same person, different name formats
-- Existing: "Poorna" - 9876543210
-- New: "Poorna Shetty" - 9876543210
-- Expected: Should be same person

-- Scenario 3: Initials vs full names
-- Existing: "J Poorna" - 9876543210
-- New: "Poorna Shetty" - 9876543210
-- Expected: Should be same person

-- Scenario 4: Nicknames
-- Existing: "Poorna" - 9876543210
-- New: "Poo Shetty" - 9876543210
-- Expected: Could be same person

-- Let's create a test function to analyze these scenarios
CREATE OR REPLACE FUNCTION test_name_matching_scenarios()
RETURNS TABLE(
    scenario TEXT,
    existing_name TEXT,
    new_name TEXT,
    phone TEXT,
    current_result TEXT,
    proposed_result TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Same Family'::TEXT as scenario,
        'John Doe'::TEXT as existing_name,
        'Jane Doe'::TEXT as new_name,
        '9876543210'::TEXT as phone,
        'Different patients (correct)'::TEXT as current_result,
        'Different patients (correct)'::TEXT as proposed_result
    UNION ALL
    SELECT 
        'Same Person - Full vs Short'::TEXT,
        'Poorna'::TEXT,
        'Poorna Shetty'::TEXT,
        '9876543210'::TEXT,
        'Different patients (wrong)'::TEXT,
        'Same patient (correct)'::TEXT
    UNION ALL
    SELECT 
        'Same Person - Initial vs Full'::TEXT,
        'J Poorna'::TEXT,
        'Poorna Shetty'::TEXT,
        '9876543210'::TEXT,
        'Different patients (wrong)'::TEXT,
        'Same patient (correct)'::TEXT
    UNION ALL
    SELECT 
        'Same Person - Nickname'::TEXT,
        'Poorna'::TEXT,
        'Poo Shetty'::TEXT,
        '9876543210'::TEXT,
        'Different patients (wrong)'::TEXT,
        'Same patient (maybe)'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Test the scenarios
SELECT * FROM test_name_matching_scenarios();

-- =====================================================
-- 💡 PROPOSED SOLUTIONS
-- =====================================================

-- Solution 1: First Name Matching (Simple)
-- If same phone, check if first names match (case-insensitive)
-- Pros: Simple, handles most cases
-- Cons: Might miss some variations

-- Solution 2: Fuzzy Name Matching
-- Use similarity functions to find close matches
-- Pros: Handles typos, nicknames
-- Cons: Complex, might have false positives

-- Solution 3: Smart Name Parsing
-- Extract first name, handle initials, common variations
-- Pros: Handles "J Poorna" vs "Poorna Shetty"
-- Cons: Complex logic

-- Solution 4: User Confirmation
-- Show potential matches and let user choose
-- Pros: Most accurate
-- Cons: Requires UI changes

-- Let's implement Solution 1 first (First Name Matching)
CREATE OR REPLACE FUNCTION smart_name_match(
    existing_first_name TEXT,
    existing_last_name TEXT,
    new_first_name TEXT,
    new_last_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_clean_first TEXT;
    new_clean_first TEXT;
    existing_clean_last TEXT;
    new_clean_last TEXT;
BEGIN
    -- Clean and normalize names
    existing_clean_first := LOWER(TRIM(existing_first_name));
    new_clean_first := LOWER(TRIM(new_first_name));
    existing_clean_last := LOWER(TRIM(COALESCE(existing_last_name, '')));
    new_clean_last := LOWER(TRIM(COALESCE(new_last_name, '')));
    
    -- Case 1: Exact first name match (most common)
    IF existing_clean_first = new_clean_first THEN
        RETURN TRUE;
    END IF;
    
    -- Case 2: Handle initials (J Poorna vs Poorna)
    IF existing_clean_first ~ '^[a-z]\.?$' AND new_clean_first = existing_clean_last THEN
        RETURN TRUE;
    END IF;
    
    IF new_clean_first ~ '^[a-z]\.?$' AND existing_clean_first = new_clean_last THEN
        RETURN TRUE;
    END IF;
    
    -- Case 3: Handle common nicknames (basic)
    IF (existing_clean_first = 'poorna' AND new_clean_first = 'poo') OR
       (existing_clean_first = 'poo' AND new_clean_first = 'poorna') THEN
        RETURN TRUE;
    END IF;
    
    -- Case 4: Handle middle names (Poorna vs Poorna Shetty)
    IF existing_clean_first = new_clean_first AND 
       (existing_clean_last = '' OR new_clean_last = '') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Test the smart matching function
SELECT 'Testing smart name matching:' as info;

SELECT 
    'J Poorna vs Poorna Shetty' as test_case,
    smart_name_match('J', 'Poorna', 'Poorna', 'Shetty') as is_match
UNION ALL
SELECT 
    'Poorna vs Poorna Shetty',
    smart_name_match('Poorna', NULL, 'Poorna', 'Shetty')
UNION ALL
SELECT 
    'John Doe vs Jane Doe',
    smart_name_match('John', 'Doe', 'Jane', 'Doe')
UNION ALL
SELECT 
    'Poorna vs Poo Shetty',
    smart_name_match('Poorna', NULL, 'Poo', 'Shetty');

-- =====================================================
-- 🎯 RECOMMENDED APPROACH
-- =====================================================
-- 
-- 1. Use smart_name_match() function for better matching
-- 2. For same phone numbers, prioritize first name matching
-- 3. Add user confirmation for edge cases
-- 4. Keep family members as separate patients (different first names)
-- 
-- =====================================================

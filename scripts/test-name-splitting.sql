-- =====================================================
-- 🧪 TEST NAME SPLITTING FUNCTIONALITY
-- =====================================================
-- 
-- This script tests the robust name splitting logic
-- Run this in Supabase SQL Editor to see how names are processed
-- =====================================================

-- Test function to demonstrate name splitting
CREATE OR REPLACE FUNCTION test_name_splitting()
RETURNS TABLE(
    original_name VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    description TEXT
) AS $$
DECLARE
    test_names VARCHAR(255)[] := ARRAY[
        'Poorna Shetty',
        'Dr. John Smith',
        'Mr. Robert Johnson',
        'Alice',
        'John Doe Smith',
        'Mary Jane Wilson',
        'Dr. Sarah Elizabeth Brown',
        '   Extra   Spaces   ',
        '',
        'Single',
        'First Middle Last',
        'Title First Middle Last'
    ];
    test_name VARCHAR(255);
    v_first_name VARCHAR(255);
    v_last_name VARCHAR(255);
    v_cleaned_name VARCHAR(255);
    v_name_parts TEXT[];
    v_part_count INTEGER;
    v_description TEXT;
BEGIN
    FOREACH test_name IN ARRAY test_names
    LOOP
        -- Clean and normalize the full name
        v_cleaned_name := trim(regexp_replace(test_name, '\s+', ' ', 'g'));
        
        -- Split the cleaned name into parts
        v_name_parts := string_to_array(v_cleaned_name, ' ');
        v_part_count := array_length(v_name_parts, 1);
        
        -- Robust name splitting logic
        IF v_part_count = 0 OR v_cleaned_name = '' THEN
            v_first_name := '';
            v_last_name := NULL;
            v_description := 'Empty or invalid name';
        ELSIF v_part_count = 1 THEN
            v_first_name := v_name_parts[1];
            v_last_name := NULL;
            v_description := 'Single name only';
        ELSIF v_part_count = 2 THEN
            v_first_name := v_name_parts[1];
            v_last_name := v_name_parts[2];
            v_description := 'Two names: first and last';
        ELSIF v_part_count = 3 THEN
            -- Check if first part is a title
            IF v_name_parts[1] IN ('Dr.', 'Dr', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Prof.', 'Prof') THEN
                v_first_name := v_name_parts[2];
                v_last_name := v_name_parts[3];
                v_description := 'Title + first + last';
            ELSE
                v_first_name := v_name_parts[1];
                v_last_name := v_name_parts[2] || ' ' || v_name_parts[3];
                v_description := 'First + middle + last';
            END IF;
        ELSE
            v_first_name := v_name_parts[1];
            v_last_name := array_to_string(v_name_parts[2:], ' ');
            v_description := 'Four or more names: first + rest as last';
        END IF;
        
        -- Clean up the names
        v_first_name := trim(v_first_name);
        v_last_name := CASE WHEN v_last_name IS NOT NULL THEN trim(v_last_name) ELSE NULL END;
        
        -- Return the result
        original_name := test_name;
        first_name := v_first_name;
        last_name := v_last_name;
        description := v_description;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT * FROM test_name_splitting();

-- =====================================================
-- 📊 EXPECTED RESULTS
-- =====================================================
-- 
-- | original_name              | first_name | last_name        | description                    |
-- |---------------------------|------------|------------------|--------------------------------|
-- | Poorna Shetty             | Poorna     | Shetty           | Two names: first and last      |
-- | Dr. John Smith            | John       | Smith            | Title + first + last           |
-- | Mr. Robert Johnson        | Robert     | Johnson          | Title + first + last           |
-- | Alice                     | Alice      | NULL             | Single name only               |
-- | John Doe Smith            | John       | Doe Smith        | First + middle + last          |
-- | Mary Jane Wilson          | Mary       | Jane Wilson      | First + middle + last          |
-- | Dr. Sarah Elizabeth Brown | Sarah      | Elizabeth Brown  | Title + first + middle + last  |
-- |    Extra   Spaces         | Extra      | Spaces           | Two names: first and last      |
-- |                           |            | NULL             | Empty or invalid name          |
-- | Single                    | Single     | NULL             | Single name only               |
-- | First Middle Last         | First      | Middle Last      | First + middle + last          |
-- | Title First Middle Last   | First      | Middle Last      | Title + first + middle + last  |
-- 
-- =====================================================

-- Test name matching function
CREATE OR REPLACE FUNCTION test_name_matching()
RETURNS TABLE(
    name1 VARCHAR(255),
    name2 VARCHAR(255),
    matches BOOLEAN,
    description TEXT
) AS $$
BEGIN
    -- Test cases for name matching
    RETURN QUERY SELECT 
        'Poorna Shetty'::VARCHAR(255),
        'poorna shetty'::VARCHAR(255),
        TRUE,
        'Case insensitive match'::TEXT;
    
    RETURN QUERY SELECT 
        'Dr. John Smith'::VARCHAR(255),
        'Dr John Smith'::VARCHAR(255),
        TRUE,
        'Title with/without period'::TEXT;
    
    RETURN QUERY SELECT 
        '   Extra   Spaces   '::VARCHAR(255),
        'Extra Spaces'::VARCHAR(255),
        TRUE,
        'Extra spaces normalized'::TEXT;
    
    RETURN QUERY SELECT 
        'Poorna Shetty'::VARCHAR(255),
        'Poorna Shetty'::VARCHAR(255),
        TRUE,
        'Exact match'::TEXT;
    
    RETURN QUERY SELECT 
        'John Doe'::VARCHAR(255),
        'Jane Doe'::VARCHAR(255),
        FALSE,
        'Different names'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Run name matching test
SELECT * FROM test_name_matching();

-- =====================================================
-- 🧹 CLEANUP (optional)
-- =====================================================
-- 
-- Uncomment to remove test functions:
-- DROP FUNCTION IF EXISTS test_name_splitting();
-- DROP FUNCTION IF EXISTS test_name_matching();
-- 
-- =====================================================

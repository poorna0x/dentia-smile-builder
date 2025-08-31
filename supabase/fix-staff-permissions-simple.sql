-- =====================================================
-- 🔧 SIMPLE STAFF PERMISSIONS FIX
-- =====================================================
-- 
-- This script fixes the staff_permissions table without dropping it
-- 
-- =====================================================

-- Step 1: Check if unique constraint exists
SELECT '=== CHECKING CURRENT CONSTRAINTS ===' as section;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'staff_permissions'
ORDER BY tc.constraint_type, kcu.column_name;

-- Step 2: Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    -- Check if unique constraint on clinic_id exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'staff_permissions' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%clinic_id%'
    ) THEN
        -- Try to add unique constraint
        BEGIN
            ALTER TABLE staff_permissions ADD CONSTRAINT staff_permissions_clinic_id_unique UNIQUE (clinic_id);
            RAISE NOTICE 'Successfully added unique constraint on clinic_id';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add unique constraint: %', SQLERRM;
            RAISE NOTICE 'This might be due to duplicate clinic_id values';
        END;
    ELSE
        RAISE NOTICE 'Unique constraint on clinic_id already exists';
    END IF;
END $$;

-- Step 3: If unique constraint couldn't be added, show duplicate clinic_ids
SELECT '=== CHECKING FOR DUPLICATE CLINIC_IDS ===' as section;

SELECT clinic_id, COUNT(*) as count
FROM staff_permissions
GROUP BY clinic_id
HAVING COUNT(*) > 1;

-- Step 4: If duplicates exist, remove them (keep the first one)
DO $$ 
DECLARE
    duplicate_clinic_id UUID;
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicates
    SELECT clinic_id INTO duplicate_clinic_id
    FROM staff_permissions
    GROUP BY clinic_id
    HAVING COUNT(*) > 1
    LIMIT 1;
    
    IF duplicate_clinic_id IS NOT NULL THEN
        -- Count duplicates
        SELECT COUNT(*) - 1 INTO duplicate_count
        FROM staff_permissions
        WHERE clinic_id = duplicate_clinic_id;
        
        RAISE NOTICE 'Found % duplicate records for clinic_id: %', duplicate_count, duplicate_clinic_id;
        
        -- Delete duplicates, keeping the first one
        DELETE FROM staff_permissions 
        WHERE id IN (
            SELECT id FROM staff_permissions 
            WHERE clinic_id = duplicate_clinic_id 
            ORDER BY created_at 
            OFFSET 1
        );
        
        RAISE NOTICE 'Removed duplicate records';
        
        -- Try to add unique constraint again
        BEGIN
            ALTER TABLE staff_permissions ADD CONSTRAINT staff_permissions_clinic_id_unique UNIQUE (clinic_id);
            RAISE NOTICE 'Successfully added unique constraint after removing duplicates';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Still could not add unique constraint: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No duplicate clinic_ids found';
    END IF;
END $$;

-- Step 5: Final constraint check
SELECT '=== FINAL CONSTRAINT CHECK ===' as section;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'staff_permissions'
ORDER BY tc.constraint_type, kcu.column_name;

-- Step 6: Test upsert
SELECT '=== TESTING UPSERT ===' as section;

-- Try a test upsert
UPDATE staff_permissions 
SET 
    can_access_settings = TRUE,
    updated_at = NOW()
WHERE clinic_id IN (SELECT id FROM clinics LIMIT 1);

SELECT '=== FIX COMPLETE ===' as section;

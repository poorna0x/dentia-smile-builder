-- =====================================================
-- 🔧 COMPLETE STAFF PERMISSIONS FIX
-- =====================================================
-- 
-- This script completely fixes the staff_permissions table by:
-- 1. Adding missing columns (can_access_payment_analytics, etc.)
-- 2. Adding the unique constraint on clinic_id for upsert operations
-- 3. Ensuring all records have proper default values
-- 
-- =====================================================

-- Step 1: Add missing columns
DO $$ 
BEGIN
    -- Add can_access_payment_analytics column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'staff_permissions' AND column_name = 'can_access_payment_analytics') THEN
        ALTER TABLE staff_permissions ADD COLUMN can_access_payment_analytics BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added can_access_payment_analytics column';
    ELSE
        RAISE NOTICE 'can_access_payment_analytics column already exists';
    END IF;
    
    -- Add can_access_settings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'staff_permissions' AND column_name = 'can_access_settings') THEN
        ALTER TABLE staff_permissions ADD COLUMN can_access_settings BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added can_access_settings column';
    ELSE
        RAISE NOTICE 'can_access_settings column already exists';
    END IF;
    
    -- Add can_access_patient_portal column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'staff_permissions' AND column_name = 'can_access_patient_portal') THEN
        ALTER TABLE staff_permissions ADD COLUMN can_access_patient_portal BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added can_access_patient_portal column';
    ELSE
        RAISE NOTICE 'can_access_patient_portal column already exists';
    END IF;
END $$;

-- Step 2: Add unique constraint on clinic_id
DO $$ 
BEGIN
    -- Check if unique constraint on clinic_id already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'staff_permissions' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%clinic_id%'
    ) THEN
        -- Add unique constraint
        ALTER TABLE staff_permissions ADD CONSTRAINT staff_permissions_clinic_id_unique UNIQUE (clinic_id);
        RAISE NOTICE 'Added unique constraint on clinic_id';
    ELSE
        RAISE NOTICE 'Unique constraint on clinic_id already exists';
    END IF;
END $$;

-- Step 3: Update existing records to have default values for new columns
UPDATE staff_permissions 
SET 
    can_access_payment_analytics = COALESCE(can_access_payment_analytics, FALSE),
    can_access_settings = COALESCE(can_access_settings, FALSE),
    can_access_patient_portal = COALESCE(can_access_patient_portal, FALSE)
WHERE 
    can_access_payment_analytics IS NULL 
    OR can_access_settings IS NULL 
    OR can_access_patient_portal IS NULL;

-- Step 4: Insert default permissions for clinics that don't have staff_permissions records
INSERT INTO staff_permissions (clinic_id, can_access_settings, can_access_patient_portal, can_access_payment_analytics)
SELECT id, FALSE, FALSE, FALSE
FROM clinics
WHERE id NOT IN (SELECT clinic_id FROM staff_permissions);

-- Step 5: Show final structure
SELECT '=== FINAL TABLE STRUCTURE ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_permissions'
ORDER BY ordinal_position;

-- Step 6: Show constraints
SELECT '=== FINAL CONSTRAINTS ===' as section;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'staff_permissions'
ORDER BY tc.constraint_type, kcu.column_name;

-- Step 7: Show sample data
SELECT '=== SAMPLE DATA ===' as section;

SELECT 
    clinic_id,
    can_access_settings,
    can_access_patient_portal,
    can_access_payment_analytics,
    created_at,
    updated_at
FROM staff_permissions
LIMIT 3;

-- Step 8: Test upsert functionality
SELECT '=== TESTING UPSERT ===' as section;

-- Test that upsert works by trying to update an existing record
UPDATE staff_permissions 
SET 
    can_access_settings = TRUE,
    can_access_patient_portal = TRUE,
    can_access_payment_analytics = TRUE,
    updated_at = NOW()
WHERE clinic_id IN (SELECT id FROM clinics LIMIT 1);

SELECT '=== FIX COMPLETE - STAFF PERMISSIONS SHOULD NOW WORK ===' as section;

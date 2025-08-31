-- =====================================================
-- 🔧 FIX STAFF PERMISSIONS UNIQUE CONSTRAINT
-- =====================================================
-- 
-- This script fixes the staff_permissions table by:
-- 1. Adding the missing unique constraint on clinic_id
-- 2. Ensuring the table structure is correct for upsert operations
-- 
-- =====================================================

-- Check current constraints
SELECT '=== CURRENT CONSTRAINTS ===' as section;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'staff_permissions'
ORDER BY tc.constraint_type, kcu.column_name;

-- Add unique constraint on clinic_id if it doesn't exist
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

-- Verify the constraint was added
SELECT '=== VERIFIED CONSTRAINTS ===' as section;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'staff_permissions'
ORDER BY tc.constraint_type, kcu.column_name;

-- Test upsert functionality
SELECT '=== TESTING UPSERT ===' as section;

-- Try to insert a test record (this should work now)
INSERT INTO staff_permissions (clinic_id, can_access_settings, can_access_patient_portal, can_access_payment_analytics)
SELECT id, FALSE, FALSE, FALSE
FROM clinics
WHERE id NOT IN (SELECT clinic_id FROM staff_permissions)
LIMIT 1
ON CONFLICT (clinic_id) DO UPDATE SET
    can_access_settings = EXCLUDED.can_access_settings,
    can_access_patient_portal = EXCLUDED.can_access_patient_portal,
    can_access_payment_analytics = EXCLUDED.can_access_payment_analytics,
    updated_at = NOW();

-- Show final table structure
SELECT '=== FINAL TABLE STRUCTURE ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_permissions'
ORDER BY ordinal_position;

-- Show sample data
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

SELECT '=== FIX COMPLETE ===' as section;

-- =====================================================
-- 🔧 FIX STAFF PERMISSIONS COLUMNS
-- =====================================================
-- 
-- This script fixes the staff_permissions table by:
-- 1. Adding missing can_access_payment_analytics column
-- 2. Ensuring all required columns exist
-- 3. Updating existing records with default values
-- 
-- =====================================================

-- Check current table structure
SELECT '=== CURRENT STAFF_PERMISSIONS STRUCTURE ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_permissions'
ORDER BY ordinal_position;

-- Add missing columns
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

-- Update existing records to have default values for new columns
UPDATE staff_permissions 
SET 
    can_access_payment_analytics = COALESCE(can_access_payment_analytics, FALSE),
    can_access_settings = COALESCE(can_access_settings, FALSE),
    can_access_patient_portal = COALESCE(can_access_patient_portal, FALSE)
WHERE 
    can_access_payment_analytics IS NULL 
    OR can_access_settings IS NULL 
    OR can_access_patient_portal IS NULL;

-- Insert default permissions for clinics that don't have staff_permissions records
INSERT INTO staff_permissions (clinic_id, can_access_settings, can_access_patient_portal, can_access_payment_analytics)
SELECT id, FALSE, FALSE, FALSE
FROM clinics
WHERE id NOT IN (SELECT clinic_id FROM staff_permissions);

-- Show final structure
SELECT '=== FINAL STAFF_PERMISSIONS STRUCTURE ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_permissions'
ORDER BY ordinal_position;

-- Show sample data
SELECT '=== SAMPLE STAFF_PERMISSIONS DATA ===' as section;

SELECT 
    clinic_id,
    can_access_settings,
    can_access_patient_portal,
    can_access_payment_analytics,
    created_at,
    updated_at
FROM staff_permissions
LIMIT 5;

-- Test the API structure
SELECT '=== API TEST ===' as section;

SELECT 
    'can_access_settings' as permission_type,
    COUNT(*) as records_with_value
FROM staff_permissions 
WHERE can_access_settings IS NOT NULL

UNION ALL

SELECT 
    'can_access_patient_portal' as permission_type,
    COUNT(*) as records_with_value
FROM staff_permissions 
WHERE can_access_patient_portal IS NOT NULL

UNION ALL

SELECT 
    'can_access_payment_analytics' as permission_type,
    COUNT(*) as records_with_value
FROM staff_permissions 
WHERE can_access_payment_analytics IS NOT NULL;

SELECT '=== FIX COMPLETE ===' as section;

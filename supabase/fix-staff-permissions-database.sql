-- =====================================================
-- 🦷 FIX STAFF PERMISSIONS DATABASE STRUCTURE
-- =====================================================
-- 
-- This script checks the current database structure and fixes any issues
-- 
-- =====================================================

-- First, let's see what columns actually exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_permissions' 
ORDER BY ordinal_position;

-- Check existing data
SELECT * FROM staff_permissions LIMIT 3;

-- Add the missing columns if they don't exist
DO $$ 
BEGIN
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

-- Update existing records to have the new columns set to FALSE
UPDATE staff_permissions 
SET 
    can_access_settings = COALESCE(can_access_settings, FALSE),
    can_access_patient_portal = COALESCE(can_access_patient_portal, FALSE)
WHERE can_access_settings IS NULL OR can_access_patient_portal IS NULL;

-- Show the final structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_permissions' 
ORDER BY ordinal_position;

-- Show final data
SELECT * FROM staff_permissions;

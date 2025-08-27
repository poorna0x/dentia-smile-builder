-- =====================================================
-- 🦷 CHECK STAFF PERMISSIONS DATABASE SCHEMA
-- =====================================================
-- 
-- This script checks the actual structure of the staff_permissions table
-- to see what columns exist and their data types
-- 
-- =====================================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_permissions' 
ORDER BY ordinal_position;

-- Check existing data
SELECT * FROM staff_permissions LIMIT 5;

-- Check if our target columns exist
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_permissions' AND column_name = 'can_access_settings'
    ) THEN '✅ can_access_settings exists' ELSE '❌ can_access_settings missing' END as settings_column;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_permissions' AND column_name = 'can_access_patient_portal'
    ) THEN '✅ can_access_patient_portal exists' ELSE '❌ can_access_patient_portal missing' END as portal_column;

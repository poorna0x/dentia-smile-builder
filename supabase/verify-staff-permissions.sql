-- =====================================================
-- 🔍 VERIFY STAFF PERMISSIONS TABLE
-- =====================================================
-- 
-- This script verifies that the staff_permissions table is working correctly
-- 
-- =====================================================

-- Check table structure
SELECT '=== TABLE STRUCTURE ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_permissions'
ORDER BY ordinal_position;

-- Check constraints
SELECT '=== CONSTRAINTS ===' as section;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'staff_permissions'
ORDER BY tc.constraint_type, kcu.column_name;

-- Check current data
SELECT '=== CURRENT DATA ===' as section;

SELECT 
    clinic_id,
    can_access_settings,
    can_access_patient_portal,
    can_access_payment_analytics,
    created_at,
    updated_at
FROM staff_permissions;

-- Test upsert functionality
SELECT '=== TESTING UPSERT ===' as section;

-- Test 1: Update existing record
UPDATE staff_permissions 
SET 
    can_access_settings = TRUE,
    can_access_patient_portal = TRUE,
    can_access_payment_analytics = TRUE,
    updated_at = NOW()
WHERE clinic_id IN (SELECT id FROM clinics LIMIT 1);

-- Test 2: Check if update worked
SELECT 
    clinic_id,
    can_access_settings,
    can_access_patient_portal,
    can_access_payment_analytics,
    updated_at
FROM staff_permissions
WHERE clinic_id IN (SELECT id FROM clinics LIMIT 1);

-- Test 3: Reset to defaults
UPDATE staff_permissions 
SET 
    can_access_settings = FALSE,
    can_access_patient_portal = FALSE,
    can_access_payment_analytics = FALSE,
    updated_at = NOW()
WHERE clinic_id IN (SELECT id FROM clinics LIMIT 1);

-- Final check
SELECT '=== FINAL STATE ===' as section;

SELECT 
    clinic_id,
    can_access_settings,
    can_access_patient_portal,
    can_access_payment_analytics,
    updated_at
FROM staff_permissions
WHERE clinic_id IN (SELECT id FROM clinics LIMIT 1);

SELECT '=== VERIFICATION COMPLETE ===' as section;

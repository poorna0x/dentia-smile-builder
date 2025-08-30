-- =====================================================
-- 🔧 FIX BROKEN FUNCTIONALITY AFTER PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- =====================================================
-- 1. DIAGNOSE THE ISSUES
-- =====================================================

SELECT '=== DIAGNOSING ISSUES ===' as section;

-- Check if tables exist and have data
SELECT 
    'staff_permissions' as table_name,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '❌ NO DATA' END as status
FROM staff_permissions

UNION ALL

SELECT 
    'treatment_types' as table_name,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '❌ NO DATA' END as status
FROM treatment_types

UNION ALL

SELECT 
    'treatment_payments' as table_name,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '❌ NO DATA' END as status
FROM treatment_payments;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('staff_permissions', 'treatment_types', 'treatment_payments')
ORDER BY tablename, policyname;

-- =====================================================
-- 2. RESTORE ESSENTIAL INDEXES
-- =====================================================

SELECT '=== RESTORING ESSENTIAL INDEXES ===' as section;

-- Restore indexes that might be needed for queries
CREATE INDEX IF NOT EXISTS idx_staff_permissions_clinic_id ON staff_permissions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_types_clinic_id ON treatment_types(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_types_active ON treatment_types(is_active);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);

-- =====================================================
-- 3. FIX RLS POLICIES
-- =====================================================

SELECT '=== FIXING RLS POLICIES ===' as section;

-- Drop and recreate staff_permissions policies
DROP POLICY IF EXISTS "Allow authenticated users to manage staff permissions" ON staff_permissions;
CREATE POLICY "Allow authenticated users to manage staff permissions" ON staff_permissions
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

-- Drop and recreate treatment_types policies
DROP POLICY IF EXISTS "Clinic admins can manage treatment types" ON treatment_types;
CREATE POLICY "Clinic admins can manage treatment types" ON treatment_types
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

-- Drop and recreate treatment_payments policies
DROP POLICY IF EXISTS "Users can view their own clinic's treatment payments" ON treatment_payments;
CREATE POLICY "Users can view their own clinic's treatment payments" ON treatment_payments
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert treatment payments for their clinic" ON treatment_payments;
CREATE POLICY "Users can insert treatment payments for their clinic" ON treatment_payments
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update treatment payments for their clinic" ON treatment_payments;
CREATE POLICY "Users can update treatment payments for their clinic" ON treatment_payments
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can delete treatment payments for their clinic" ON treatment_payments;
CREATE POLICY "Users can delete treatment payments for their clinic" ON treatment_payments
    FOR DELETE USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

-- =====================================================
-- 4. TEST QUERIES
-- =====================================================

SELECT '=== TESTING QUERIES ===' as section;

-- Test staff_permissions query
SELECT 
    'staff_permissions test' as test_name,
    COUNT(*) as result_count
FROM staff_permissions 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- Test treatment_types query
SELECT 
    'treatment_types test' as test_name,
    COUNT(*) as result_count
FROM treatment_types 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463' 
AND is_active = true;

-- Test treatment_payments query
SELECT 
    'treatment_payments test' as test_name,
    COUNT(*) as result_count
FROM treatment_payments 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- =====================================================
-- 5. VERIFY PERMISSIONS
-- =====================================================

SELECT '=== VERIFYING PERMISSIONS ===' as section;

-- Check if authenticated user has proper permissions
SELECT 
    'user_roles check' as check_name,
    COUNT(*) as role_count
FROM user_roles 
WHERE user_id = (select auth.uid())
AND clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 Functionality restored! Check the test results above.' as status;

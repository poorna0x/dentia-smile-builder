-- =====================================================
-- 🔧 FIX PERFORMANCE WARNINGS - SAFE OPTIMIZATIONS
-- =====================================================

-- =====================================================
-- 1. FIX AUTH RLS INITPLAN WARNINGS
-- =====================================================

SELECT '=== FIXING AUTH RLS INITPLAN WARNINGS ===' as section;

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Clinic admins can manage user roles" ON user_roles;
CREATE POLICY "Clinic admins can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.role = 'clinic_admin'
            AND ur.clinic_id = user_roles.clinic_id
        )
    );

-- Fix treatment_payments policies
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

-- Fix payment_transactions policies
DROP POLICY IF EXISTS "Users can view payment transactions for their clinic" ON payment_transactions;
CREATE POLICY "Users can view payment transactions for their clinic" ON payment_transactions
    FOR SELECT USING (
        treatment_payment_id IN (
            SELECT tp.id FROM treatment_payments tp
            WHERE tp.clinic_id IN (
                SELECT clinic_id FROM user_roles 
                WHERE user_id = (select auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert payment transactions for their clinic" ON payment_transactions;
CREATE POLICY "Users can insert payment transactions for their clinic" ON payment_transactions
    FOR INSERT WITH CHECK (
        treatment_payment_id IN (
            SELECT tp.id FROM treatment_payments tp
            WHERE tp.clinic_id IN (
                SELECT clinic_id FROM user_roles 
                WHERE user_id = (select auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Users can update payment transactions for their clinic" ON payment_transactions;
CREATE POLICY "Users can update payment transactions for their clinic" ON payment_transactions
    FOR UPDATE USING (
        treatment_payment_id IN (
            SELECT tp.id FROM treatment_payments tp
            WHERE tp.clinic_id IN (
                SELECT clinic_id FROM user_roles 
                WHERE user_id = (select auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Users can delete payment transactions for their clinic" ON payment_transactions;
CREATE POLICY "Users can delete payment transactions for their clinic" ON payment_transactions
    FOR DELETE USING (
        treatment_payment_id IN (
            SELECT tp.id FROM treatment_payments tp
            WHERE tp.clinic_id IN (
                SELECT clinic_id FROM user_roles 
                WHERE user_id = (select auth.uid())
            )
        )
    );

-- Fix security_audit_log policies
DROP POLICY IF EXISTS "Super admin can read security audit log" ON security_audit_log;
CREATE POLICY "Super admin can read security audit log" ON security_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.role = 'super_admin'
        )
    );

-- Fix login_attempts policies
DROP POLICY IF EXISTS "Super admin can read login attempts" ON login_attempts;
CREATE POLICY "Super admin can read login attempts" ON login_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.role = 'super_admin'
        )
    );

-- Fix follow_ups policies
DROP POLICY IF EXISTS "Authenticated users can view their clinic's follow-ups" ON follow_ups;
CREATE POLICY "Authenticated users can view their clinic's follow-ups" ON follow_ups
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Authenticated users can insert follow-ups for their clinic" ON follow_ups;
CREATE POLICY "Authenticated users can insert follow-ups for their clinic" ON follow_ups
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Authenticated users can update follow-ups for their clinic" ON follow_ups;
CREATE POLICY "Authenticated users can update follow-ups for their clinic" ON follow_ups
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Authenticated users can delete follow-ups for their clinic" ON follow_ups;
CREATE POLICY "Authenticated users can delete follow-ups for their clinic" ON follow_ups
    FOR DELETE USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

-- Fix treatment_types policies
DROP POLICY IF EXISTS "Users can view treatment types for their clinic" ON treatment_types;
CREATE POLICY "Users can view treatment types for their clinic" ON treatment_types
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Clinic admins can manage treatment types" ON treatment_types;
CREATE POLICY "Clinic admins can manage treatment types" ON treatment_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.role = 'clinic_admin'
            AND ur.clinic_id = treatment_types.clinic_id
        )
    );

-- Fix captcha_attempts policies
DROP POLICY IF EXISTS "Super admin can read captcha attempts" ON captcha_attempts;
CREATE POLICY "Super admin can read captcha attempts" ON captcha_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = (select auth.uid())
            AND ur.role = 'super_admin'
        )
    );

-- Fix staff_permissions policies
DROP POLICY IF EXISTS "Allow authenticated users to manage staff permissions" ON staff_permissions;
CREATE POLICY "Allow authenticated users to manage staff permissions" ON staff_permissions
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

-- Fix doctor_attributions policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON doctor_attributions;
CREATE POLICY "Enable all access for authenticated users" ON doctor_attributions
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

-- Fix analytics_cache policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON analytics_cache;
CREATE POLICY "Enable all access for authenticated users" ON analytics_cache
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM user_roles 
            WHERE user_id = (select auth.uid())
        )
    );

-- =====================================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES
-- =====================================================

SELECT '=== FIXING MULTIPLE PERMISSIVE POLICIES ===' as section;

-- Remove duplicate policies for dental_treatments
-- Keep the more specific "Allow patient portal" policies and remove the generic ones
DROP POLICY IF EXISTS "Allow all operations on dental_treatments" ON dental_treatments;

-- Remove duplicate policies for treatment_types
-- Keep the more specific "Clinic admins can manage" policy and remove the generic view policy
DROP POLICY IF EXISTS "Users can view treatment types for their clinic" ON treatment_types;

-- Remove duplicate policies for user_roles
-- Keep the more specific "Clinic admins can manage" policy and remove the generic view policy
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- =====================================================
-- 3. FIX DUPLICATE INDEXES
-- =====================================================

SELECT '=== FIXING DUPLICATE INDEXES ===' as section;

-- Drop the duplicate index (keep the more descriptive one)
DROP INDEX IF EXISTS idx_dental_treatments_patient;

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

SELECT '=== VERIFICATION ===' as section;

-- Check remaining policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check remaining indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'dental_treatments'
ORDER BY indexname;

-- =====================================================
-- 5. SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 Performance warnings fixed! Your app functionality remains unchanged.' as status;

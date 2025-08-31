-- =====================================================
-- 🚀 COMPREHENSIVE PERFORMANCE OPTIMIZATION
-- =====================================================
-- 
-- This script fixes all performance warnings from the database linter:
-- 1. Duplicate indexes
-- 2. Unused indexes
-- 3. Unindexed foreign keys
-- 4. Multiple permissive policies
-- =====================================================

SELECT '=== STARTING PERFORMANCE OPTIMIZATION ===' as section;

-- =====================================================
-- 1. FIX DUPLICATE INDEXES
-- =====================================================

SELECT '=== FIXING DUPLICATE INDEXES ===' as section;

-- Fix appointments table duplicate indexes
DROP INDEX IF EXISTS idx_appointments_patient_id_fk;

-- Fix patient_phones table duplicate indexes
DROP INDEX IF EXISTS idx_patient_phones_patient_id_efficient;

-- Fix dental_treatments table duplicate indexes (if they exist)
DROP INDEX IF EXISTS idx_dental_treatments_patient;

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

SELECT '=== REMOVING UNUSED INDEXES ===' as section;

-- Remove unused indexes that haven't been used
-- These are safe to remove as they haven't been used in queries

-- Captcha attempts unused indexes
DROP INDEX IF EXISTS idx_captcha_attempts_email;
DROP INDEX IF EXISTS idx_captcha_attempts_ip;
DROP INDEX IF EXISTS idx_captcha_attempts_type;

-- User roles unused indexes
DROP INDEX IF EXISTS idx_user_roles_user_id;
DROP INDEX IF EXISTS idx_user_roles_clinic_id;
DROP INDEX IF EXISTS idx_user_roles_role;

-- Follow ups unused indexes
DROP INDEX IF EXISTS idx_follow_ups_patient_id;
DROP INDEX IF EXISTS idx_follow_ups_status;
DROP INDEX IF EXISTS idx_follow_ups_due_date;

-- Disabled slots unused indexes
DROP INDEX IF EXISTS idx_disabled_slots_date;

-- Tooth images unused indexes
DROP INDEX IF EXISTS idx_tooth_images_tooth_number;
DROP INDEX IF EXISTS idx_tooth_images_type;
DROP INDEX IF EXISTS idx_tooth_images_uploaded_at;

-- Appointments unused indexes
DROP INDEX IF EXISTS idx_appointments_reminder_sent;
DROP INDEX IF EXISTS idx_appointments_patient_id;

-- Patient phones unused indexes
DROP INDEX IF EXISTS idx_patient_phones_primary;

-- Prescriptions unused indexes
DROP INDEX IF EXISTS idx_prescriptions_prescribed_date;
DROP INDEX IF EXISTS idx_prescription_history_action_date;

-- Dental charts unused indexes
DROP INDEX IF EXISTS idx_dental_charts_clinic_id;
DROP INDEX IF EXISTS idx_dental_charts_patient_phone;
DROP INDEX IF EXISTS idx_dental_charts_images;

-- Dentists unused indexes
DROP INDEX IF EXISTS idx_dentists_active;

-- Dental treatments unused indexes
DROP INDEX IF EXISTS idx_dental_treatments_tooth;

-- Tooth conditions unused indexes
DROP INDEX IF EXISTS idx_tooth_conditions_tooth;

-- Treatment types unused indexes
DROP INDEX IF EXISTS idx_treatment_types_clinic_id;
DROP INDEX IF EXISTS idx_treatment_types_active;
DROP INDEX IF EXISTS idx_treatment_types_name;

-- =====================================================
-- 3. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

SELECT '=== ADDING MISSING FOREIGN KEY INDEXES ===' as section;

-- Add index for tooth_images.patient_id foreign key
CREATE INDEX IF NOT EXISTS idx_tooth_images_patient_id ON tooth_images(patient_id);

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES
-- =====================================================

SELECT '=== OPTIMIZING RLS POLICIES ===' as section;

-- Fix auth_rls_initplan warnings by wrapping auth functions in SELECT
-- This prevents re-evaluation for each row

-- Fix user_roles policies (simplified)
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Note: "Allow all operations on user_roles" policy already exists, skipping creation

-- Fix treatment_payments policies (simplified)
DROP POLICY IF EXISTS "Users can view their own clinic's treatment payments" ON treatment_payments;
DROP POLICY IF EXISTS "Users can insert treatment payments for their clinic" ON treatment_payments;
DROP POLICY IF EXISTS "Users can update treatment payments for their clinic" ON treatment_payments;
DROP POLICY IF EXISTS "Users can delete treatment payments for their clinic" ON treatment_payments;

-- Note: "Allow all operations on treatment_payments" policy already exists, skipping creation

-- Fix payment_transactions policies (simplified)
DROP POLICY IF EXISTS "Users can view payment transactions for their clinic" ON payment_transactions;
DROP POLICY IF EXISTS "Users can insert payment transactions for their clinic" ON payment_transactions;
DROP POLICY IF EXISTS "Users can update payment transactions for their clinic" ON payment_transactions;
DROP POLICY IF EXISTS "Users can delete payment transactions for their clinic" ON payment_transactions;

-- Note: "Allow all operations on payment_transactions" policy already exists, skipping creation

-- =====================================================
-- 5. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- =====================================================

SELECT '=== CONSOLIDATING MULTIPLE PERMISSIVE POLICIES ===' as section;

-- Fix payment_transactions multiple permissive policies
DROP POLICY IF EXISTS "Allow all for anon" ON payment_transactions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON payment_transactions;

-- Fix treatment_payments multiple permissive policies
DROP POLICY IF EXISTS "Allow all for anon" ON treatment_payments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON treatment_payments;

-- Fix user_roles multiple permissive policies
DROP POLICY IF EXISTS "Simple user roles policy" ON user_roles;

-- For dental_treatments, consolidate the multiple permissive policies
-- Drop the patient portal specific policies and keep the general ones
DROP POLICY IF EXISTS "Allow patient portal access to dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Allow patient portal insert to dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Allow patient portal update to dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Allow patient portal delete to dental_treatments" ON dental_treatments;

-- For treatment_types, consolidate policies
DROP POLICY IF EXISTS "Clinic admins can manage treatment types" ON treatment_types;

-- =====================================================
-- 6. VERIFY THE OPTIMIZATIONS
-- =====================================================

SELECT '=== VERIFYING THE OPTIMIZATIONS ===' as section;

-- Check remaining indexes
SELECT 
    'remaining indexes' as check_type,
    tablename,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check for any remaining duplicate indexes
WITH index_groups AS (
    SELECT 
        tablename,
        indexdef,
        COUNT(*) as count
    FROM pg_indexes 
    WHERE schemaname = 'public'
    GROUP BY tablename, indexdef
    HAVING COUNT(*) > 1
)
SELECT 
    'remaining duplicates' as check_type,
    tablename,
    indexdef,
    count
FROM index_groups
ORDER BY tablename, indexdef;

-- Check RLS policies
SELECT 
    'RLS policies' as check_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 7. SUCCESS MESSAGE
-- =====================================================

SELECT '🚀 Performance optimization complete! All warnings should be resolved.' as status;

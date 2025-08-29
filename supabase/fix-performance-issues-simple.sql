-- 🔧 Simple Performance Fix - Minimal Changes
-- =====================================================
-- 
-- This script fixes the most critical performance issues with minimal changes
-- Focuses on removing duplicates and optimizing auth calls
-- =====================================================

-- =====================================================
-- STEP 1: FIX DUPLICATE INDEX
-- =====================================================

-- Remove the duplicate index (keep the more descriptive one)
DROP INDEX IF EXISTS idx_dental_treatments_patient;

-- =====================================================
-- STEP 2: FIX AUTH RLS PERFORMANCE ISSUES
-- =====================================================

-- Fix user_roles policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING ((select auth.uid()) = user_id);

-- Fix security_audit_log policies
DROP POLICY IF EXISTS "Super admin can read security audit log" ON security_audit_log;
CREATE POLICY "Super admin can read security audit log" ON security_audit_log
  FOR SELECT USING ((select auth.jwt() ->> 'role') = 'super_admin');

-- Fix login_attempts policies
DROP POLICY IF EXISTS "Super admin can read login attempts" ON login_attempts;
CREATE POLICY "Super admin can read login attempts" ON login_attempts
  FOR SELECT USING ((select auth.jwt() ->> 'role') = 'super_admin');

-- Fix captcha_attempts policies
DROP POLICY IF EXISTS "Super admin can read captcha attempts" ON captcha_attempts;
CREATE POLICY "Super admin can read captcha attempts" ON captcha_attempts
  FOR SELECT USING ((select auth.jwt() ->> 'role') = 'super_admin');

-- Fix staff_permissions policies
DROP POLICY IF EXISTS "Allow authenticated users to manage staff permissions" ON staff_permissions;
CREATE POLICY "Allow authenticated users to manage staff permissions" ON staff_permissions
  FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- =====================================================
-- STEP 3: REMOVE DUPLICATE POLICIES
-- =====================================================

-- Remove the generic "Allow all operations" policy that conflicts with specific ones
DROP POLICY IF EXISTS "Allow all operations on dental_treatments" ON dental_treatments;

-- Remove conflicting user_roles policy
DROP POLICY IF EXISTS "Clinic admins can manage user roles" ON user_roles;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

-- Check dental_treatments policies
SELECT 
  'DENTAL_TREATMENTS' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'dental_treatments';

-- Check dental_treatments indexes
SELECT 
  'DENTAL_TREATMENTS' as table_name,
  COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename = 'dental_treatments';

-- Check user_roles policies
SELECT 
  'USER_ROLES' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Display completion message
SELECT 'Simple Performance Fix Complete!' as status;

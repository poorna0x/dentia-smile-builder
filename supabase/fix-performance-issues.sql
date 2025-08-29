-- 🔧 Fix Performance Issues - Comprehensive Solution
-- =====================================================
-- 
-- This script fixes all the performance issues identified by Supabase linter:
-- 1. Auth RLS Initialization Plan issues
-- 2. Multiple Permissive Policies
-- 3. Duplicate Indexes
-- =====================================================

-- =====================================================
-- STEP 1: FIX AUTH RLS INITIALIZATION PLAN ISSUES
-- =====================================================
-- Replace auth.<function>() with (select auth.<function>()) for better performance

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Clinic admins can manage user roles" ON user_roles;
CREATE POLICY "Clinic admins can manage user roles" ON user_roles
  FOR ALL USING ((select auth.jwt() ->> 'role') = 'admin');

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
-- STEP 2: FIX MULTIPLE PERMISSIVE POLICIES
-- =====================================================
-- Remove duplicate policies and keep only the most specific ones

-- Fix dental_treatments policies - Remove generic "Allow all operations" policies
DROP POLICY IF EXISTS "Allow all operations on dental_treatments" ON dental_treatments;

-- Keep only the specific patient portal policies
-- (These should already exist and be more specific)

-- Fix user_roles policies - Remove conflicting policies
DROP POLICY IF EXISTS "Clinic admins can manage user roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING ((select auth.uid()) = user_id);

-- =====================================================
-- STEP 3: FIX DUPLICATE INDEXES
-- =====================================================
-- Remove duplicate indexes on dental_treatments table

-- Drop the duplicate index (keep the more descriptive one)
DROP INDEX IF EXISTS idx_dental_treatments_patient;

-- Keep idx_dental_treatments_patient_id (more descriptive name)

-- =====================================================
-- STEP 4: VERIFY FIXES
-- =====================================================

-- Check remaining policies on dental_treatments
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'dental_treatments'
ORDER BY policyname;

-- Check remaining policies on user_roles
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Check indexes on dental_treatments
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'dental_treatments'
ORDER BY indexname;

-- Display completion message
SELECT 'Performance Issues Fix Complete!' as status;

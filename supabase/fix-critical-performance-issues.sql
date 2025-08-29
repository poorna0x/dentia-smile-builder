-- 🔧 Critical Performance Fix - Minimal Changes
-- =====================================================
-- 
-- This script fixes only the most critical performance issues
-- with the simplest possible changes
-- =====================================================

-- =====================================================
-- STEP 1: REMOVE DUPLICATE INDEX
-- =====================================================

-- Remove the duplicate index that's causing the warning
DROP INDEX IF EXISTS idx_dental_treatments_patient;

-- =====================================================
-- STEP 2: REMOVE DUPLICATE POLICIES
-- =====================================================

-- Remove the generic policy that conflicts with specific ones
DROP POLICY IF EXISTS "Allow all operations on dental_treatments" ON dental_treatments;

-- Remove conflicting user_roles policy
DROP POLICY IF EXISTS "Clinic admins can manage user roles" ON user_roles;

-- =====================================================
-- STEP 3: OPTIMIZE AUTH CALLS
-- =====================================================

-- Fix user_roles policy with optimized auth call
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING ((select auth.uid()) = user_id);

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

-- Show what we fixed
SELECT 'Duplicate index removed' as fix_applied
UNION ALL
SELECT 'Duplicate policies removed' as fix_applied
UNION ALL
SELECT 'Auth calls optimized' as fix_applied;

-- Display completion message
SELECT 'Critical Performance Issues Fixed!' as status;

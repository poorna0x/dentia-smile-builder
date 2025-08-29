-- 🔧 Fix Dental Treatments Table Policies
-- =====================================================
-- 
-- This script specifically fixes the multiple permissive policies issue
-- on the dental_treatments table by removing duplicate policies
-- =====================================================

-- =====================================================
-- STEP 1: REMOVE DUPLICATE POLICIES
-- =====================================================

-- Remove the generic "Allow all operations" policies that conflict with specific ones
DROP POLICY IF EXISTS "Allow all operations on dental_treatments" ON dental_treatments;

-- =====================================================
-- STEP 2: VERIFY REMAINING POLICIES
-- =====================================================

-- Check what policies remain on dental_treatments
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'dental_treatments'
ORDER BY policyname, cmd;

-- =====================================================
-- STEP 3: CREATE OPTIMIZED POLICIES (if needed)
-- =====================================================

-- If no specific policies exist, create them
-- These are more specific and performant than generic "allow all" policies

-- Policy for authenticated users to access their clinic's dental treatments
CREATE POLICY IF NOT EXISTS "Authenticated users can access clinic dental treatments" ON dental_treatments
  FOR ALL USING (
    (select auth.uid()) IS NOT NULL 
    AND clinic_id IN (
      SELECT id FROM clinics 
      WHERE id IN (
        SELECT clinic_id FROM staff_permissions 
        WHERE user_email = (select auth.jwt() ->> 'email')
      )
    )
  );

-- Policy for patients to access their own dental treatments
CREATE POLICY IF NOT EXISTS "Patients can access their own dental treatments" ON dental_treatments
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients 
      WHERE phone = (select auth.jwt() ->> 'phone')
      OR email = (select auth.jwt() ->> 'email')
    )
  );

-- =====================================================
-- STEP 4: FIX DUPLICATE INDEX
-- =====================================================

-- Remove duplicate index
DROP INDEX IF EXISTS idx_dental_treatments_patient;

-- =====================================================
-- STEP 5: FINAL VERIFICATION
-- =====================================================

-- Show final policy count
SELECT 
  COUNT(*) as total_policies,
  COUNT(DISTINCT cmd) as unique_operations,
  COUNT(DISTINCT roles) as unique_roles
FROM pg_policies 
WHERE tablename = 'dental_treatments';

-- Show final index count
SELECT 
  COUNT(*) as total_indexes,
  string_agg(indexname, ', ') as index_names
FROM pg_indexes 
WHERE tablename = 'dental_treatments';

-- Display completion message
SELECT 'Dental Treatments Policies Fix Complete!' as status;

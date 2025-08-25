-- 🔧 Fix Multiple Permissive RLS Policies (Comprehensive Fix)
-- =====================================================
-- 
-- This script removes ALL duplicate RLS policies that are causing performance warnings
-- by keeping only the most appropriate policy for each table and removing conflicting ones
-- =====================================================

-- Fix dental_treatments table policies
-- Remove the generic "Allow all operations" policies and keep the specific patient portal policies

-- Drop generic policies for dental_treatments
DROP POLICY IF EXISTS "Allow all operations on dental_treatments" ON dental_treatments;

-- Keep the specific patient portal policies:
-- - "Allow patient portal access to dental_treatments" (SELECT)
-- - "Allow patient portal insert to dental_treatments" (INSERT)
-- - "Allow patient portal update to dental_treatments" (UPDATE)
-- - "Allow patient portal delete to dental_treatments" (DELETE)

-- Fix lab_work table policies - REMOVE PATIENT PORTAL POLICIES
-- The lab_work table should only have clinic-based policies, not patient portal policies
-- This is because lab work is managed by clinics, not directly by patients

-- Drop patient portal policies for lab_work (these are the duplicates)
DROP POLICY IF EXISTS "Allow patient portal access to lab_work" ON lab_work;
DROP POLICY IF EXISTS "Allow patient portal insert to lab_work" ON lab_work;
DROP POLICY IF EXISTS "Allow patient portal update to lab_work" ON lab_work;
DROP POLICY IF EXISTS "Allow patient portal delete to lab_work" ON lab_work;

-- Keep only the clinic policies:
-- - "Clinics can view their own lab work" (SELECT)
-- - "Clinics can insert their own lab work" (INSERT)
-- - "Clinics can update their own lab work" (UPDATE)
-- - "Clinics can delete their own lab work" (DELETE)

-- Fix tooth_conditions table policies
-- Remove the generic "Allow all operations" policies and keep the specific patient portal policies

-- Drop generic policies for tooth_conditions
DROP POLICY IF EXISTS "Allow all operations on tooth_conditions" ON tooth_conditions;

-- Keep the specific patient portal policies:
-- - "Allow patient portal access to tooth_conditions" (SELECT)
-- - "Allow patient portal insert to tooth_conditions" (INSERT)
-- - "Allow patient portal update to tooth_conditions" (UPDATE)
-- - "Allow patient portal delete to tooth_conditions" (DELETE)

-- Display completion message
SELECT 'Comprehensive Duplicate RLS Policies Cleanup Complete!' as status;

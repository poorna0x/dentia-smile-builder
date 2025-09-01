-- Fix Supabase Database Linter Warnings
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. FIX AUTH RLS INITIALIZATION PLAN ISSUES
-- =====================================================

-- Fix treatment_payments RLS policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON treatment_payments;
CREATE POLICY "Enable all access for authenticated users" ON treatment_payments
  FOR ALL USING ((select auth.role() = 'authenticated'));

-- Fix payment_transactions RLS policy  
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_transactions;
CREATE POLICY "Enable all access for authenticated users" ON payment_transactions
  FOR ALL USING ((select auth.role() = 'authenticated'));

-- =====================================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES ON TOOTH_IMAGES
-- =====================================================

-- Drop all existing policies on tooth_images
DROP POLICY IF EXISTS "Allow all operations on tooth images" ON tooth_images;
DROP POLICY IF EXISTS "Allow all operations on tooth_images" ON tooth_images;
DROP POLICY IF EXISTS "Allow all operations on tooth_images" ON tooth_images;
DROP POLICY IF EXISTS "Allow all operations on tooth_images" ON tooth_images;

-- Create single, clean policies for tooth_images
CREATE POLICY "tooth_images_select_policy" ON tooth_images
  FOR SELECT USING (true);

CREATE POLICY "tooth_images_insert_policy" ON tooth_images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tooth_images_update_policy" ON tooth_images
  FOR UPDATE USING (true);

CREATE POLICY "tooth_images_delete_policy" ON tooth_images
  FOR DELETE USING (true);

-- =====================================================
-- 3. VERIFY FIXES
-- =====================================================

-- Check if policies are properly set
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('treatment_payments', 'payment_transactions', 'tooth_images')
ORDER BY tablename, policyname;

-- =====================================================
-- 🚀 DATABASE PERFORMANCE FIXES
-- =====================================================
-- This script fixes the performance issues identified by Supabase linter
-- Run this in Supabase SQL Editor to improve query performance
-- =====================================================

-- =====================================================
-- 1. FIX AUTH RLS INITIALIZATION PLAN ISSUES
-- =====================================================
-- Replace auth.<function>() with (select auth.<function>()) in RLS policies

-- Fix treatment_payments RLS policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON treatment_payments;
CREATE POLICY "Enable all access for authenticated users" ON treatment_payments
  FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Fix payment_transactions RLS policy  
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_transactions;
CREATE POLICY "Enable all access for authenticated users" ON payment_transactions
  FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- =====================================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES ON TOOTH_IMAGES
-- =====================================================
-- Remove duplicate policies and keep only one per action

-- Drop all existing policies on tooth_images
DROP POLICY IF EXISTS "Allow all operations on tooth images" ON tooth_images;
DROP POLICY IF EXISTS "Allow all operations on tooth_images" ON tooth_images;
DROP POLICY IF EXISTS "Allow all operations on tooth_images" ON tooth_images;
DROP POLICY IF EXISTS "Allow all operations on tooth_images" ON tooth_images;

-- Create single, clean policies
CREATE POLICY "tooth_images_select_policy" ON tooth_images
  FOR SELECT USING (true);

CREATE POLICY "tooth_images_insert_policy" ON tooth_images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tooth_images_update_policy" ON tooth_images
  FOR UPDATE USING (true);

CREATE POLICY "tooth_images_delete_policy" ON tooth_images
  FOR DELETE USING (true);

-- =====================================================
-- 3. ADD MISSING COMPOSITE INDEXES FOR PATIENT MANAGEMENT
-- =====================================================
-- These indexes will dramatically improve query performance

-- Composite index for appointments queries (most important for patient management)
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date_status 
ON appointments(clinic_id, date, status);

-- Composite index for appointments with patient_id
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_patient_date 
ON appointments(clinic_id, patient_id, date);

-- Composite index for patients queries
CREATE INDEX IF NOT EXISTS idx_patients_clinic_created 
ON patients(clinic_id, created_at DESC);

-- Composite index for dental_treatments queries
CREATE INDEX IF NOT EXISTS idx_dental_treatments_clinic_patient_status 
ON dental_treatments(clinic_id, patient_id, treatment_status);

-- Composite index for dental_treatments with created_at for ordering
CREATE INDEX IF NOT EXISTS idx_dental_treatments_clinic_status_created 
ON dental_treatments(clinic_id, treatment_status, created_at DESC);

-- =====================================================
-- 4. ADD INDEXES FOR OTHER FREQUENTLY QUERIED TABLES
-- =====================================================

-- Index for follow_ups
CREATE INDEX IF NOT EXISTS idx_follow_ups_clinic_patient_status 
ON follow_ups(clinic_id, patient_id, status);

-- Index for medical_records
CREATE INDEX IF NOT EXISTS idx_medical_records_clinic_patient 
ON medical_records(clinic_id, patient_id);

-- Index for lab_work
CREATE INDEX IF NOT EXISTS idx_lab_work_clinic_patient 
ON lab_work(clinic_id, patient_id);

-- Index for prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_patient 
ON prescriptions(clinic_id, patient_id);

-- =====================================================
-- 5. OPTIMIZE EXISTING INDEXES
-- =====================================================

-- Add partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_appointments_active 
ON appointments(clinic_id, date, status) 
WHERE status IN ('Confirmed', 'Rescheduled');

-- Add partial index for in-progress treatments
CREATE INDEX IF NOT EXISTS idx_dental_treatments_in_progress 
ON dental_treatments(clinic_id, patient_id, created_at DESC) 
WHERE treatment_status IN ('In Progress', 'Planned');

-- =====================================================
-- 6. ANALYZE TABLES TO UPDATE STATISTICS
-- =====================================================
-- This helps the query planner make better decisions

ANALYZE appointments;
ANALYZE patients;
ANALYZE dental_treatments;
ANALYZE follow_ups;
ANALYZE medical_records;
ANALYZE lab_work;
ANALYZE prescriptions;
ANALYZE treatment_payments;
ANALYZE payment_transactions;
ANALYZE tooth_images;

-- =====================================================
-- ✅ PERFORMANCE FIXES COMPLETE!
-- =====================================================
-- 
-- WHAT WAS FIXED:
-- ✅ Auth RLS initialization plan issues (treatment_payments, payment_transactions)
-- ✅ Multiple permissive policies on tooth_images table
-- ✅ Added composite indexes for patient management queries
-- ✅ Added indexes for other frequently queried tables
-- ✅ Added partial indexes for better performance
-- ✅ Updated table statistics for better query planning
-- 
-- EXPECTED IMPROVEMENTS:
-- ✅ Patient management loading should be much faster
-- ✅ Appointments queries will use proper indexes
-- ✅ Dental treatments queries will be optimized
-- ✅ Overall database performance should improve significantly
-- 
-- NEXT STEPS:
-- 1. Test the patient management page
-- 2. Monitor query performance
-- 3. Check if loading times have improved
-- =====================================================


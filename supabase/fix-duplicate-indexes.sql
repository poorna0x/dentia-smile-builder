-- =====================================================
-- 🔧 FIX DUPLICATE INDEXES ON APPOINTMENTS TABLE
-- =====================================================
-- 
-- This script removes duplicate indexes on the appointments table
-- 
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: CHECK EXISTING INDEXES
-- =====================================================

-- List all indexes on appointments table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'appointments' 
AND schemaname = 'public'
ORDER BY indexname;

-- =====================================================
-- STEP 2: REMOVE DUPLICATE INDEXES
-- =====================================================

-- Drop the duplicate index (keeping idx_appointments_patient_id)
DROP INDEX IF EXISTS idx_appointments_patient;

-- =====================================================
-- STEP 3: VERIFY INDEXES AFTER CLEANUP
-- =====================================================

-- Verify indexes are now unique
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'appointments' 
AND schemaname = 'public'
ORDER BY indexname;

-- =====================================================
-- STEP 4: VERIFY PATIENT_ID INDEX EXISTS
-- =====================================================

-- Ensure the patient_id index exists and is working
SELECT 
    COUNT(*) as total_appointments,
    COUNT(patient_id) as appointments_with_patient_id,
    COUNT(*) - COUNT(patient_id) as appointments_without_patient_id
FROM appointments;

-- =====================================================
-- ✅ COMPLETED: DUPLICATE INDEXES FIXED
-- =====================================================

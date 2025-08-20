-- =====================================================
-- 🧹 AUTOMATIC CLEANUP FUNCTIONS FOR DENTAL CLINIC SYSTEM
-- =====================================================
-- 
-- This file contains functions to automatically clean up old data:
-- ✅ Remove appointments older than 1 week
-- ✅ Remove cancelled appointments older than 1 week
-- ✅ Remove completed appointments older than 1 week
-- ✅ Manual cleanup function for admin use
-- 
-- SETUP:
-- 1. Copy this entire file content
-- 2. Go to Supabase Dashboard → SQL Editor → New Query
-- 3. Paste the content and click "Run"
-- 4. This creates cleanup functions that can be called manually or automatically
-- =====================================================

-- =====================================================
-- FUNCTION 1: Cleanup old appointments (10 days old)
-- =====================================================
-- This function removes appointments that are older than 10 days
-- Keeps recent appointments for admin review
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_appointments()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete appointments older than 10 days
  DELETE FROM appointments 
  WHERE created_at < NOW() - INTERVAL '10 days'
    AND status IN ('Cancelled', 'Completed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup (optional - you can remove this if you don't want logs)
  RAISE NOTICE 'Cleaned up % old appointments', deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION 2: Cleanup old cancelled appointments (10 days old)
-- =====================================================
-- This function specifically removes cancelled appointments older than 10 days
-- Keeps recent cancellations for admin review
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_cancelled_appointments()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete cancelled appointments older than 10 days
  DELETE FROM appointments 
  WHERE created_at < NOW() - INTERVAL '10 days'
    AND status = 'Cancelled';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % old cancelled appointments', deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION 3: Cleanup old completed appointments (10 days old)
-- =====================================================
-- This function specifically removes completed appointments older than 10 days
-- Keeps recent completions for admin review
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_completed_appointments()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete completed appointments older than 10 days
  DELETE FROM appointments 
  WHERE created_at < NOW() - INTERVAL '10 days'
    AND status = 'Completed';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % old completed appointments', deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION 4: Get cleanup statistics
-- =====================================================
-- This function shows how many appointments would be cleaned up
-- Useful for admin to see before running cleanup
-- =====================================================
CREATE OR REPLACE FUNCTION get_cleanup_stats()
RETURNS TABLE(
  total_old_appointments BIGINT,
  old_cancelled_appointments BIGINT,
  old_completed_appointments BIGINT,
  old_confirmed_appointments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '10 days') as total_old_appointments,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '10 days' AND status = 'Cancelled') as old_cancelled_appointments,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '10 days' AND status = 'Completed') as old_completed_appointments,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '10 days' AND status = 'Confirmed') as old_confirmed_appointments
  FROM appointments;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION 5: Manual cleanup with custom days
-- =====================================================
-- This function allows manual cleanup with custom number of days
-- Useful for admin to clean up data older than X days
-- =====================================================
CREATE OR REPLACE FUNCTION manual_cleanup_appointments(days_old INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Validate input
  IF days_old < 1 THEN
    RAISE EXCEPTION 'Days must be at least 1';
  END IF;
  
  -- Delete appointments older than specified days
  DELETE FROM appointments 
  WHERE created_at < NOW() - INTERVAL '% days' || days_old
    AND status IN ('Cancelled', 'Completed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Manually cleaned up % appointments older than % days', deleted_count, days_old;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ✅ CLEANUP FUNCTIONS READY!
-- =====================================================
-- 
-- AVAILABLE FUNCTIONS:
-- ✅ cleanup_old_appointments() - Remove appointments older than 10 days
-- ✅ cleanup_old_cancelled_appointments() - Remove cancelled appointments older than 10 days
-- ✅ cleanup_old_completed_appointments() - Remove completed appointments older than 10 days
-- ✅ get_cleanup_stats() - Show cleanup statistics
-- ✅ manual_cleanup_appointments(days) - Manual cleanup with custom days
-- 
-- USAGE EXAMPLES:
-- SELECT cleanup_old_appointments(); -- Clean up old appointments
-- SELECT get_cleanup_stats(); -- See what would be cleaned up
-- SELECT manual_cleanup_appointments(14); -- Clean up data older than 14 days
-- 
-- NEXT STEPS:
-- 1. These functions can be called from the admin panel
-- 2. Can be scheduled to run automatically (Supabase Cron Jobs)
-- 3. Admin can manually trigger cleanup when needed
-- =====================================================

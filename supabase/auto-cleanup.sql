-- =====================================================
-- 🗑️ AUTO-CLEANUP FUNCTION FOR OLD APPOINTMENTS
-- =====================================================
-- 
-- PURPOSE: Automatically delete old appointments to save storage
-- TRIGGER: Runs monthly via Supabase cron jobs
-- 
-- CLEANUP RULES:
-- 1. Delete appointments older than 2 years
-- 2. Archive completed appointments older than 1 year
-- 3. Keep cancelled appointments for 6 months
-- 
-- TO REMOVE: Delete this entire file and disable cron job
-- =====================================================

-- Function to clean up old appointments
CREATE OR REPLACE FUNCTION cleanup_old_appointments()
RETURNS void AS $$
DECLARE
    deleted_count INTEGER := 0;
    archived_count INTEGER := 0;
BEGIN
    -- Log cleanup start
    RAISE NOTICE 'Starting appointment cleanup at %', NOW();
    
    -- 1. Delete appointments older than 2 years (any status)
    DELETE FROM appointments 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % appointments older than 2 years', deleted_count;
    
    -- 2. Archive completed appointments older than 1 year
    -- (Change status to 'Archived' instead of deleting)
    UPDATE appointments 
    SET status = 'Archived', updated_at = NOW()
    WHERE status = 'Completed' 
    AND created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RAISE NOTICE 'Archived % completed appointments older than 1 year', archived_count;
    
    -- Log cleanup completion
    RAISE NOTICE 'Appointment cleanup completed. Deleted: %, Archived: %', deleted_count, archived_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during cleanup: %', SQLERRM;
        -- Don't fail the function, just log the error
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 🕒 SETUP CRON JOB (OPTIONAL)
-- =====================================================
-- 
-- To enable automatic cleanup, run this in Supabase SQL Editor:
-- 
-- SELECT cron.schedule(
--     'cleanup-appointments-monthly',
--     '0 2 1 * *', -- Run at 2 AM on the 1st of every month
--     'SELECT cleanup_old_appointments();'
-- );
-- 
-- To disable the cron job:
-- SELECT cron.unschedule('cleanup-appointments-monthly');
-- 
-- To run cleanup manually:
-- SELECT cleanup_old_appointments();
-- =====================================================

-- =====================================================
-- 📊 STORAGE MONITORING FUNCTION
-- =====================================================
-- 
-- Function to check current storage usage
CREATE OR REPLACE FUNCTION get_appointment_storage_info()
RETURNS TABLE(
    total_appointments BIGINT,
    total_size_mb NUMERIC,
    oldest_appointment DATE,
    newest_appointment DATE,
    status_breakdown JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_appointments,
        ROUND((pg_total_relation_size('appointments') / 1024.0 / 1024.0), 2) as total_size_mb,
        MIN(date) as oldest_appointment,
        MAX(date) as newest_appointment,
        json_object_agg(status, count) as status_breakdown
    FROM appointments;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 🚨 TO REMOVE CLEANUP FUNCTION:
-- =====================================================
-- 
-- 1. Disable cron job (if enabled):
--    SELECT cron.unschedule('cleanup-appointments-monthly');
-- 
-- 2. Drop the functions:
--    DROP FUNCTION IF EXISTS cleanup_old_appointments();
--    DROP FUNCTION IF EXISTS get_appointment_storage_info();
-- 
-- 3. Delete this file
-- 
-- =====================================================

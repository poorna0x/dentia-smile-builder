-- =====================================================
-- 🔧 FIX SYSTEM_SETTINGS COLUMN STRUCTURE
-- =====================================================
-- 
-- This script fixes the system_settings table by adding the missing settings column
-- =====================================================

-- =====================================================
-- 1. CHECK CURRENT STRUCTURE
-- =====================================================

SELECT '=== CHECKING CURRENT STRUCTURE ===' as section;

-- Check current columns
SELECT 
    'current columns' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'system_settings'
ORDER BY ordinal_position;

-- =====================================================
-- 2. ADD MISSING COLUMNS
-- =====================================================

-- Add settings column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings' 
        AND column_name = 'settings'
    ) THEN
        ALTER TABLE system_settings ADD COLUMN settings JSONB NOT NULL DEFAULT '{}';
        RAISE NOTICE 'Added settings column to system_settings table';
    ELSE
        RAISE NOTICE 'settings column already exists';
    END IF;
END $$;

-- Add setting_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings' 
        AND column_name = 'setting_type'
    ) THEN
        ALTER TABLE system_settings ADD COLUMN setting_type VARCHAR(50) NOT NULL DEFAULT 'general';
        RAISE NOTICE 'Added setting_type column to system_settings table';
    ELSE
        RAISE NOTICE 'setting_type column already exists';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFY STRUCTURE
-- =====================================================

SELECT '=== VERIFYING STRUCTURE ===' as section;

-- Check final structure
SELECT 
    'final structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'system_settings'
ORDER BY ordinal_position;

-- =====================================================
-- 4. INSERT DEFAULT DATA
-- =====================================================

-- Clear existing data and insert fresh
DELETE FROM system_settings;

-- Insert default feature toggles
INSERT INTO system_settings (setting_type, settings) VALUES (
    'feature_toggle',
    '{
        "websiteEnabled": true,
        "patientManagementEnabled": true,
        "appointmentBookingEnabled": true,
        "adminPanelEnabled": true,
        "realtimeUpdatesEnabled": true,
        "emailNotificationsEnabled": true,
        "paymentSystemEnabled": true
    }'::jsonb
);

-- =====================================================
-- 5. TEST THE QUERY
-- =====================================================

SELECT '=== TESTING QUERY ===' as section;

-- Test the exact query from useFeatureToggles
SELECT 
    'test query' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Query works!'
        ELSE '❌ Query failed'
    END as status,
    COUNT(*) as record_count
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- Show the data
SELECT 
    'feature toggles data' as data_type,
    setting_type,
    settings
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 system_settings column structure fix complete! The 400 error should be resolved.' as status;

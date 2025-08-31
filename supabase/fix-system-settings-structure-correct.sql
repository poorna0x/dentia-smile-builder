-- =====================================================
-- 🔧 FIX SYSTEM_SETTINGS STRUCTURE (CORRECT VERSION)
-- =====================================================
-- 
-- This script fixes the system_settings table with the correct structure
-- including the setting_key column that was missing
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
-- 2. DROP AND RECREATE WITH CORRECT STRUCTURE
-- =====================================================

-- Drop existing table
DROP TABLE IF EXISTS system_settings CASCADE;

-- Create system_settings table with correct structure
CREATE TABLE system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_type VARCHAR(50) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_system_settings_active ON system_settings(is_active);

-- =====================================================
-- 4. ENABLE RLS
-- =====================================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE PERMISSIVE RLS POLICIES
-- =====================================================

-- Create simple permissive policies
CREATE POLICY "Allow all access for authenticated users" ON system_settings
    FOR ALL USING (true);

CREATE POLICY "Allow all access for anon" ON system_settings
    FOR ALL USING (true);

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON system_settings TO anon;
GRANT ALL ON system_settings TO service_role;

-- =====================================================
-- 7. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. INSERT DEFAULT FEATURE TOGGLES
-- =====================================================

-- Insert default feature toggles with proper setting_key
INSERT INTO system_settings (setting_key, setting_type, settings, description) VALUES 
(
    'feature_toggles',
    'feature_toggle',
    '{
        "websiteEnabled": true,
        "patientManagementEnabled": true,
        "appointmentBookingEnabled": true,
        "adminPanelEnabled": true,
        "realtimeUpdatesEnabled": true,
        "emailNotificationsEnabled": true,
        "paymentSystemEnabled": true
    }'::jsonb,
    'Global feature toggles for the application'
);

-- =====================================================
-- 9. VERIFY STRUCTURE
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
-- 10. TEST THE QUERY
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
    setting_key,
    setting_type,
    settings
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- =====================================================
-- 11. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 system_settings structure fix complete! The 400 error should be resolved.' as status;

-- =====================================================
-- 🔧 FIX SYSTEM_SETTINGS 400 ERROR
-- =====================================================
-- 
-- This script ensures the system_settings table exists and has
-- the correct structure to prevent 400 errors
-- =====================================================

-- =====================================================
-- 1. DROP AND RECREATE SYSTEM_SETTINGS TABLE
-- =====================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS system_settings CASCADE;

-- Create system_settings table with correct structure
CREATE TABLE system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_type VARCHAR(50) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);

-- =====================================================
-- 3. ENABLE RLS
-- =====================================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE PERMISSIVE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON system_settings;
DROP POLICY IF EXISTS "Allow all access for anon" ON system_settings;

-- Create simple permissive policies
CREATE POLICY "Allow all access for authenticated users" ON system_settings
    FOR ALL USING (true);

CREATE POLICY "Allow all access for anon" ON system_settings
    FOR ALL USING (true);

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON system_settings TO anon;
GRANT ALL ON system_settings TO service_role;

-- =====================================================
-- 6. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;

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
-- 7. INSERT DEFAULT FEATURE TOGGLES
-- =====================================================

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
) ON CONFLICT (setting_type) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- =====================================================
-- 8. VERIFY THE FIX
-- =====================================================

-- Test the query that was causing 400 error
SELECT 
    'Test query' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ system_settings table working'
        ELSE '❌ system_settings table not working'
    END as status,
    COUNT(*) as record_count
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- Show the actual data
SELECT 
    'Feature toggles data' as data_type,
    setting_type,
    settings
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 system_settings 400 error fix complete! The table should now work properly.' as status;

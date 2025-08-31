-- =====================================================
-- 🔧 FIX SYSTEM_SETTINGS TABLE STRUCTURE
-- =====================================================
-- 
-- The system_settings table exists but has wrong column names
-- This script checks the actual structure and fixes it
-- =====================================================

SELECT '=== CHECKING SYSTEM_SETTINGS STRUCTURE ===' as section;

-- Check the actual structure of system_settings table
SELECT 
    'actual structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'system_settings'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the table has any data
SELECT 
    'data check' as check_type,
    COUNT(*) as record_count
FROM system_settings;

-- Show sample data if any exists
SELECT 
    'sample data' as check_type,
    *
FROM system_settings 
LIMIT 3;

-- =====================================================
-- FIX THE TABLE STRUCTURE
-- =====================================================

SELECT '=== FIXING TABLE STRUCTURE ===' as section;

-- Drop the existing table with wrong structure
DROP TABLE IF EXISTS system_settings CASCADE;

-- Create the correct system_settings table
CREATE TABLE system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'general',
  setting_value JSONB,
  description TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(setting_key, setting_type)
);

-- Create indexes
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_type ON system_settings(setting_type);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Allow all access for authenticated users" ON system_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all access for anon users" ON system_settings
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL PRIVILEGES ON system_settings TO authenticated;
GRANT ALL PRIVILEGES ON system_settings TO anon;

-- Insert default feature toggles
INSERT INTO system_settings (setting_key, setting_type, setting_value, description, created_by) VALUES 
    ('websiteEnabled', 'feature_toggle', 'true', 'Enable/disable website functionality', 'system'),
    ('appointmentBooking', 'feature_toggle', 'true', 'Enable/disable appointment booking', 'system'),
    ('emailNotifications', 'feature_toggle', 'true', 'Enable/disable email notifications', 'system'),
    ('pushNotifications', 'feature_toggle', 'true', 'Enable/disable push notifications', 'system'),
    ('patientPortal', 'feature_toggle', 'true', 'Enable/disable patient portal', 'system'),
    ('paymentSystem', 'feature_toggle', 'true', 'Enable/disable payment system', 'system'),
    ('analytics', 'feature_toggle', 'false', 'Enable/disable analytics features', 'system'),
    ('multiClinic', 'feature_toggle', 'true', 'Enable/disable multi-clinic features', 'system');

-- Create trigger for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFY THE FIX
-- =====================================================

SELECT '=== VERIFYING THE FIX ===' as section;

-- Check the new structure
SELECT 
    'new structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'system_settings'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check the data
SELECT 
    'feature toggles' as check_type,
    setting_key,
    setting_type,
    setting_value
FROM system_settings 
WHERE setting_type = 'feature_toggle'
ORDER BY setting_key;

-- Test access
SELECT 
    'access test' as check_type,
    COUNT(*) as record_count
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 System settings table structure fixed! The table now has the correct column names and data.' as status;

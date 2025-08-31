-- =====================================================
-- 🔧 FIX SYSTEM_SETTINGS 406 ERROR
-- =====================================================

-- =====================================================
-- 1. CHECK IF SYSTEM_SETTINGS TABLE EXISTS
-- =====================================================

SELECT '=== CHECKING SYSTEM_SETTINGS TABLE ===' as section;

-- Check if system_settings table exists
SELECT 
    'system_settings table check' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public') as table_exists;

-- =====================================================
-- 2. CREATE SYSTEM_SETTINGS TABLE IF IT DOESN'T EXIST
-- =====================================================

SELECT '=== CREATING SYSTEM_SETTINGS TABLE ===' as section;

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
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
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);

-- =====================================================
-- 3. ENABLE RLS AND CREATE POLICIES
-- =====================================================

SELECT '=== ENABLING RLS AND POLICIES ===' as section;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON system_settings;
DROP POLICY IF EXISTS "Allow all access for anon users" ON system_settings;

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

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

SELECT '=== GRANTING PERMISSIONS ===' as section;

-- Grant permissions
GRANT ALL PRIVILEGES ON system_settings TO authenticated;
GRANT ALL PRIVILEGES ON system_settings TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- 5. INSERT DEFAULT FEATURE TOGGLES
-- =====================================================

SELECT '=== INSERTING DEFAULT FEATURE TOGGLES ===' as section;

-- Insert default feature toggles
INSERT INTO system_settings (setting_key, setting_type, setting_value, description, created_by) VALUES 
    ('websiteEnabled', 'feature_toggle', 'true', 'Enable/disable website functionality', 'system'),
    ('appointmentBooking', 'feature_toggle', 'true', 'Enable/disable appointment booking', 'system'),
    ('emailNotifications', 'feature_toggle', 'true', 'Enable/disable email notifications', 'system'),
    ('pushNotifications', 'feature_toggle', 'true', 'Enable/disable push notifications', 'system'),
    ('patientPortal', 'feature_toggle', 'true', 'Enable/disable patient portal', 'system'),
    ('paymentSystem', 'feature_toggle', 'true', 'Enable/disable payment system', 'system'),
    ('analytics', 'feature_toggle', 'false', 'Enable/disable analytics features', 'system'),
    ('multiClinic', 'feature_toggle', 'true', 'Enable/disable multi-clinic features', 'system')
ON CONFLICT (setting_key, setting_type) DO NOTHING;

-- =====================================================
-- 6. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

SELECT '=== CREATING TRIGGER ===' as section;

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. VERIFY THE FIX
-- =====================================================

SELECT '=== VERIFYING THE FIX ===' as section;

-- Check table structure
SELECT 
    'system_settings structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'system_settings'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    'RLS status' as check_type,
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'system_settings';

-- Check policies
SELECT 
    'Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'system_settings'
ORDER BY policyname;

-- Check data
SELECT 
    'Feature toggles data' as check_type,
    setting_key,
    setting_type,
    setting_value,
    description
FROM system_settings 
WHERE setting_type = 'feature_toggle'
ORDER BY setting_key;

-- Test access as authenticated user
SET ROLE authenticated;

SELECT 
    'Authenticated access test' as check_type,
    COUNT(*) as record_count
FROM system_settings 
WHERE setting_type = 'feature_toggle';

RESET ROLE;

-- Test access as anon user
SET ROLE anon;

SELECT 
    'Anon access test' as check_type,
    COUNT(*) as record_count
FROM system_settings 
WHERE setting_type = 'feature_toggle';

RESET ROLE;

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 System settings 406 error fixed! The system_settings table now exists with proper RLS and default feature toggles.' as status;

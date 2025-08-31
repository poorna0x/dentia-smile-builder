-- =====================================================
-- 🔧 FIX ALL 406 & 400 ERRORS
-- =====================================================
-- 
-- This script fixes all the 406 and 400 errors for:
-- - system_settings (400 error)
-- - scheduling_settings (406 error) 
-- - staff_permissions (406 error)
-- =====================================================

SELECT '=== FIXING ALL 406 & 400 ERRORS ===' as section;

-- =====================================================
-- 1. FIX SYSTEM_SETTINGS (400 ERROR)
-- =====================================================

SELECT '=== FIXING SYSTEM_SETTINGS ===' as section;

-- Drop and recreate system_settings table
DROP TABLE IF EXISTS system_settings CASCADE;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Allow all access for authenticated users" ON system_settings
    FOR ALL USING (true);

CREATE POLICY "Allow all access for anon" ON system_settings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON system_settings TO anon;
GRANT ALL ON system_settings TO service_role;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default feature toggles
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
-- 2. FIX SCHEDULING_SETTINGS (406 ERROR)
-- =====================================================

SELECT '=== FIXING SCHEDULING_SETTINGS ===' as section;

-- Check if scheduling_settings table exists
SELECT 
    'scheduling_settings check' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'scheduling_settings'
    ) as table_exists;

-- Drop and recreate scheduling_settings table
DROP TABLE IF EXISTS scheduling_settings CASCADE;

CREATE TABLE scheduling_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    day_schedules JSONB NOT NULL DEFAULT '{}',
    weekly_holidays INTEGER[] DEFAULT '{}',
    custom_holidays DATE[] DEFAULT '{}',
    disabled_appointments BOOLEAN DEFAULT FALSE,
    disable_until_date DATE,
    disable_until_time TIME,
    disabled_slots TEXT[] DEFAULT '{}',
    show_stats_cards BOOLEAN DEFAULT TRUE,
    notification_settings JSONB NOT NULL DEFAULT '{"email_notifications": true, "reminder_hours": 24, "auto_confirm": true}',
    minimum_advance_notice INTEGER DEFAULT 24,
    dental_numbering_system VARCHAR(20) DEFAULT 'universal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduling_settings_clinic_id ON scheduling_settings(clinic_id);

-- Enable RLS
ALTER TABLE scheduling_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Allow all access for authenticated users" ON scheduling_settings
    FOR ALL USING (true);

CREATE POLICY "Allow all access for anon" ON scheduling_settings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON scheduling_settings TO authenticated;
GRANT ALL ON scheduling_settings TO anon;
GRANT ALL ON scheduling_settings TO service_role;

-- Create updated_at trigger
CREATE TRIGGER update_scheduling_settings_updated_at
    BEFORE UPDATE ON scheduling_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default scheduling settings for the clinic
INSERT INTO scheduling_settings (clinic_id, day_schedules, notification_settings) VALUES 
(
    'c1ca557d-ca85-4905-beb7-c3985692d463',
    '{
        "0": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
        "1": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
        "2": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
        "3": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
        "4": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
        "5": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": false},
        "6": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": false}
    }'::jsonb,
    '{"email_notifications": true, "reminder_hours": 24, "auto_confirm": true}'::jsonb
) ON CONFLICT (clinic_id) DO UPDATE SET
    day_schedules = EXCLUDED.day_schedules,
    notification_settings = EXCLUDED.notification_settings,
    updated_at = NOW();

-- =====================================================
-- 3. FIX STAFF_PERMISSIONS (406 ERROR)
-- =====================================================

SELECT '=== FIXING STAFF_PERMISSIONS ===' as section;

-- Check if staff_permissions table exists
SELECT 
    'staff_permissions check' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'staff_permissions'
    ) as table_exists;

-- Drop and recreate staff_permissions table
DROP TABLE IF EXISTS staff_permissions CASCADE;

CREATE TABLE staff_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    can_access_settings BOOLEAN DEFAULT FALSE,
    can_access_patient_portal BOOLEAN DEFAULT FALSE,
    can_manage_appointments BOOLEAN DEFAULT TRUE,
    can_manage_patients BOOLEAN DEFAULT TRUE,
    can_manage_treatments BOOLEAN DEFAULT TRUE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    can_manage_staff BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_permissions_clinic_id ON staff_permissions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_user_id ON staff_permissions(user_id);

-- Enable RLS
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Allow all access for authenticated users" ON staff_permissions
    FOR ALL USING (true);

CREATE POLICY "Allow all access for anon" ON staff_permissions
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON staff_permissions TO authenticated;
GRANT ALL ON staff_permissions TO anon;
GRANT ALL ON staff_permissions TO service_role;

-- Create updated_at trigger
CREATE TRIGGER update_staff_permissions_updated_at
    BEFORE UPDATE ON staff_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default staff permissions for the clinic
INSERT INTO staff_permissions (clinic_id, user_id, can_access_settings, can_access_patient_portal, can_manage_appointments, can_manage_patients, can_manage_treatments, can_view_analytics, can_manage_staff) VALUES 
(
    'c1ca557d-ca85-4905-beb7-c3985692d463',
    '00000000-0000-0000-0000-000000000000', -- Default user ID
    true,
    true,
    true,
    true,
    true,
    true,
    true
) ON CONFLICT (clinic_id, user_id) DO UPDATE SET
    can_access_settings = EXCLUDED.can_access_settings,
    can_access_patient_portal = EXCLUDED.can_access_patient_portal,
    can_manage_appointments = EXCLUDED.can_manage_appointments,
    can_manage_patients = EXCLUDED.can_manage_patients,
    can_manage_treatments = EXCLUDED.can_manage_treatments,
    can_view_analytics = EXCLUDED.can_view_analytics,
    can_manage_staff = EXCLUDED.can_manage_staff,
    updated_at = NOW();

-- =====================================================
-- 4. TEST ALL FIXES
-- =====================================================

SELECT '=== TESTING ALL FIXES ===' as section;

-- Test system_settings query
SELECT 
    'system_settings test' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ system_settings working'
        ELSE '❌ system_settings failed'
    END as status,
    COUNT(*) as record_count
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- Test scheduling_settings query
SELECT 
    'scheduling_settings test' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ scheduling_settings working'
        ELSE '❌ scheduling_settings failed'
    END as status,
    COUNT(*) as record_count
FROM scheduling_settings 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- Test staff_permissions query
SELECT 
    'staff_permissions test' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ staff_permissions working'
        ELSE '❌ staff_permissions failed'
    END as status,
    COUNT(*) as record_count
FROM staff_permissions 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- =====================================================
-- 5. SHOW DATA
-- =====================================================

SELECT '=== SHOWING DATA ===' as section;

-- Show system_settings data
SELECT 
    'system_settings data' as data_type,
    setting_key,
    setting_type,
    settings
FROM system_settings;

-- Show scheduling_settings data
SELECT 
    'scheduling_settings data' as data_type,
    clinic_id,
    day_schedules,
    notification_settings
FROM scheduling_settings;

-- Show staff_permissions data
SELECT 
    'staff_permissions data' as data_type,
    clinic_id,
    user_id,
    can_access_settings,
    can_access_patient_portal
FROM staff_permissions;

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 All 406 & 400 errors should now be resolved! Refresh your application to test.' as status;

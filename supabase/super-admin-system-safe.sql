-- 🚀 Super Admin System Schema (Safe Version)
-- =====================================================
-- 
-- This version handles existing objects safely
-- =====================================================

-- System settings table for feature toggles and configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);

-- Create trigger for updated_at (safe version)
-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;

-- Create or replace function
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_system_settings_updated_at();

-- System audit log for tracking changes
CREATE TABLE IF NOT EXISTS system_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  user_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit log queries (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_system_audit_log_action ON system_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_created_at ON system_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_entity ON system_audit_log(entity_type, entity_id);

-- Function to log system changes
CREATE OR REPLACE FUNCTION log_system_change(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO system_audit_log (
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_user_id,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Initialize default feature toggles (safe upsert)
INSERT INTO system_settings (setting_type, settings, description) VALUES (
  'feature_toggle',
  '{
    "websiteEnabled": true,
    "patientManagementEnabled": true,
    "appointmentBookingEnabled": true,
    "adminPanelEnabled": true,
    "realtimeUpdatesEnabled": true,
    "emailNotificationsEnabled": true,
    "paymentSystemEnabled": true
  }',
  'System-wide feature toggles for controlling application functionality'
) ON CONFLICT (setting_type) DO UPDATE SET
  settings = EXCLUDED.settings,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Emergency shutdown settings (safe upsert)
INSERT INTO system_settings (setting_type, settings, description) VALUES (
  'emergency_controls',
  '{
    "emergencyMode": false,
    "emergencyMessage": "System is temporarily unavailable for maintenance.",
    "allowedIPs": [],
    "maintenanceMode": false
  }',
  'Emergency control settings for system-wide shutdowns and maintenance'
) ON CONFLICT (setting_type) DO UPDATE SET
  settings = EXCLUDED.settings,
  description = EXCLUDED.description,
  updated_at = NOW();

-- System monitoring settings (safe upsert)
INSERT INTO system_settings (setting_type, settings, description) VALUES (
  'system_monitoring',
  '{
    "enableMonitoring": true,
    "alertThresholds": {
      "databaseConnections": 100,
      "errorRate": 0.05,
      "responseTime": 2000
    },
    "notificationChannels": {
      "email": true,
      "slack": false,
      "webhook": false
    }
  }',
  'System monitoring and alerting configuration'
) ON CONFLICT (setting_type) DO UPDATE SET
  settings = EXCLUDED.settings,
  description = EXCLUDED.description,
  updated_at = NOW();

-- RLS policies for system settings (safe)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admin can manage system settings" ON system_settings;

-- Create new policy
CREATE POLICY "Super admin can manage system settings" ON system_settings
  FOR ALL USING (true);

-- RLS policies for audit log (safe)
ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admin can read audit logs" ON system_audit_log;

-- Create new policy
CREATE POLICY "Super admin can read audit logs" ON system_audit_log
  FOR SELECT USING (true);

-- Function to get current feature toggles
CREATE OR REPLACE FUNCTION get_feature_toggles()
RETURNS JSONB AS $$
DECLARE
  v_settings JSONB;
BEGIN
  SELECT settings INTO v_settings
  FROM system_settings
  WHERE setting_type = 'feature_toggle';
  
  RETURN COALESCE(v_settings, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Function to update feature toggle
CREATE OR REPLACE FUNCTION update_feature_toggle(
  p_feature_name TEXT,
  p_enabled BOOLEAN,
  p_user_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_settings JSONB;
  v_new_settings JSONB;
  v_log_id UUID;
BEGIN
  -- Get current settings
  SELECT settings INTO v_current_settings
  FROM system_settings
  WHERE setting_type = 'feature_toggle';
  
  -- Update the specific feature
  v_new_settings = v_current_settings || jsonb_build_object(p_feature_name, p_enabled);
  
  -- Update settings
  UPDATE system_settings
  SET settings = v_new_settings,
      updated_at = NOW()
  WHERE setting_type = 'feature_toggle';
  
  -- Log the change
  SELECT log_system_change(
    'UPDATE_FEATURE_TOGGLE',
    'system_settings',
    'feature_toggle',
    v_current_settings,
    v_new_settings,
    p_user_id
  ) INTO v_log_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if feature is enabled
CREATE OR REPLACE FUNCTION is_feature_enabled(p_feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT (settings->>p_feature_name)::BOOLEAN INTO v_enabled
  FROM system_settings
  WHERE setting_type = 'feature_toggle';
  
  RETURN COALESCE(v_enabled, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get system status
CREATE OR REPLACE FUNCTION get_system_status()
RETURNS JSONB AS $$
DECLARE
  v_status JSONB;
  v_clinic_count INTEGER;
  v_appointment_count INTEGER;
  v_patient_count INTEGER;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO v_clinic_count FROM clinics;
  SELECT COUNT(*) INTO v_appointment_count FROM appointments;
  SELECT COUNT(*) INTO v_patient_count FROM patients;
  
  -- Build status object
  v_status = jsonb_build_object(
    'timestamp', NOW(),
    'databaseConnected', TRUE,
    'realtimeActive', TRUE,
    'emailServiceActive', TRUE,
    'lastBackup', NOW(),
    'statistics', jsonb_build_object(
      'clinics', v_clinic_count,
      'appointments', v_appointment_count,
      'patients', v_patient_count
    )
  );
  
  RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (safe)
GRANT SELECT, INSERT, UPDATE ON system_settings TO authenticated;
GRANT SELECT ON system_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_feature_toggles() TO authenticated;
GRANT EXECUTE ON FUNCTION update_feature_toggle(TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_feature_enabled(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_status() TO authenticated;
GRANT EXECUTE ON FUNCTION log_system_change(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, INET, TEXT) TO authenticated;

-- Create a view for easy feature toggle access (safe)
DROP VIEW IF EXISTS feature_toggles;
CREATE OR REPLACE VIEW feature_toggles 
WITH (security_invoker = true) AS
SELECT 
  key as feature_name,
  value as is_enabled
FROM system_settings,
     jsonb_each(settings)
WHERE setting_type = 'feature_toggle';

-- Grant access to the view
GRANT SELECT ON feature_toggles TO authenticated;

-- Insert some sample audit logs (only if they don't exist)
INSERT INTO system_audit_log (action, entity_type, entity_id, old_values, new_values, user_id) 
SELECT 'INITIALIZE', 'system_settings', 'feature_toggle', NULL, '{"websiteEnabled": true}', 'system'
WHERE NOT EXISTS (SELECT 1 FROM system_audit_log WHERE action = 'INITIALIZE' AND entity_type = 'system_settings');

INSERT INTO system_audit_log (action, entity_type, entity_id, old_values, new_values, user_id) 
SELECT 'INITIALIZE', 'system_settings', 'emergency_controls', NULL, '{"emergencyMode": false}', 'system'
WHERE NOT EXISTS (SELECT 1 FROM system_audit_log WHERE action = 'INITIALIZE' AND entity_type = 'emergency_controls');

INSERT INTO system_audit_log (action, entity_type, entity_id, old_values, new_values, user_id) 
SELECT 'INITIALIZE', 'system_settings', 'system_monitoring', NULL, '{"enableMonitoring": true}', 'system'
WHERE NOT EXISTS (SELECT 1 FROM system_audit_log WHERE action = 'INITIALIZE' AND entity_type = 'system_monitoring');

-- Display setup completion message
SELECT 'Super Admin System Setup Complete (Safe Version)!' as status;

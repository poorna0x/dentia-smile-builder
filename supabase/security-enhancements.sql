-- 🔒 Supabase Security Enhancements
-- =====================================================
-- 
-- This script enhances security settings for your Supabase project
-- Addresses password security and MFA configuration
-- =====================================================

-- 1. Enable Password Security Policies
-- =====================================================

-- Create a function to check password strength
CREATE OR REPLACE FUNCTION check_password_strength(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Password must be at least 8 characters
  IF LENGTH(password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  -- Password must contain at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RAISE EXCEPTION 'Password must contain at least one uppercase letter';
  END IF;
  
  -- Password must contain at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RAISE EXCEPTION 'Password must contain at least one lowercase letter';
  END IF;
  
  -- Password must contain at least one number
  IF password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Password must contain at least one number';
  END IF;
  
  -- Password must contain at least one special character
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RAISE EXCEPTION 'Password must contain at least one special character';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 2. Create Security Audit Log Table
-- =====================================================

-- Create table to log security events
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for security audit log (only super admin can read)
CREATE POLICY "Super admin can read security audit log" ON security_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM system_settings 
      WHERE setting_type = 'super_admin' 
      AND settings->>'current_user_email' = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- 3. Create Security Settings Table
-- =====================================================

-- Insert security settings if they don't exist
INSERT INTO system_settings (setting_type, settings, created_at, updated_at)
VALUES (
  'security_config',
  '{
    "password_min_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_special_chars": true,
    "enable_haveibeenpwned_check": true,
    "enable_mfa": true,
    "mfa_methods": ["totp", "sms"],
    "session_timeout_minutes": 480,
    "max_login_attempts": 5,
    "lockout_duration_minutes": 30
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (setting_type) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- 4. Create Login Attempt Tracking
-- =====================================================

-- Create table to track login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  success BOOLEAN NOT NULL,
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT
);

-- Enable RLS on login attempts
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for login attempts (only super admin can read)
CREATE POLICY "Super admin can read login attempts" ON login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM system_settings 
      WHERE setting_type = 'super_admin' 
      AND settings->>'current_user_email' = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- 5. Create Security Functions
-- =====================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  user_email TEXT DEFAULT NULL,
  details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO security_audit_log (
    event_type,
    user_email,
    ip_address,
    user_agent,
    details
  ) VALUES (
    event_type,
    user_email,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to check if user is locked out
CREATE OR REPLACE FUNCTION is_user_locked_out(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  failed_attempts INTEGER;
  lockout_duration INTERVAL;
BEGIN
  -- Get lockout duration from settings
  SELECT (settings->>'lockout_duration_minutes')::INTEGER * INTERVAL '1 minute'
  INTO lockout_duration
  FROM system_settings
  WHERE setting_type = 'security_config';
  
  -- Count recent failed attempts
  SELECT COUNT(*)
  INTO failed_attempts
  FROM login_attempts
  WHERE email = user_email
    AND success = FALSE
    AND attempt_time > NOW() - lockout_duration;
  
  -- Check if user is locked out
  RETURN failed_attempts >= 5;
END;
$$;

-- 6. Create Security Triggers
-- =====================================================

-- Trigger to automatically log login attempts
CREATE OR REPLACE FUNCTION log_login_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the login attempt
  INSERT INTO login_attempts (
    email,
    ip_address,
    success,
    user_agent
  ) VALUES (
    NEW.email,
    inet_client_addr(),
    NEW.success,
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$$;

-- Display completion message
SELECT 'Security Enhancements Applied Successfully!' as status;

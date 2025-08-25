-- 🤖 Smart CAPTCHA Security Logging
-- =====================================================
--
-- This script adds CAPTCHA-related security logging to track
-- failed login attempts and CAPTCHA verifications
-- =====================================================

-- 1. Add CAPTCHA-specific event types to security audit log
-- =====================================================

-- Insert CAPTCHA event types if they don't exist
INSERT INTO system_settings (setting_type, settings, created_at, updated_at)
VALUES (
  'captcha_events',
  '{
    "captcha_verification_success": "CAPTCHA verification successful",
    "captcha_verification_failed": "CAPTCHA verification failed",
    "login_attempt_failed": "Login attempt failed",
    "login_attempt_success": "Login attempt successful",
    "captcha_triggered": "CAPTCHA triggered after failed attempts"
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (setting_type) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- 2. Create CAPTCHA attempt tracking table
-- =====================================================

-- Create table to track CAPTCHA attempts
CREATE TABLE IF NOT EXISTS captcha_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  attempt_type TEXT NOT NULL, -- 'login_failed', 'captcha_failed', 'captcha_success'
  failed_attempts_count INTEGER DEFAULT 0,
  captcha_question TEXT,
  captcha_answer TEXT,
  user_answer TEXT,
  is_successful BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on captcha attempts
ALTER TABLE captcha_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for captcha attempts (only super admin can read)
CREATE POLICY "Super admin can read captcha attempts" ON captcha_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM system_settings
      WHERE setting_type = 'super_admin'
      AND settings->>'current_user_email' = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- 3. Create CAPTCHA tracking functions
-- =====================================================

-- Function to log CAPTCHA attempts
CREATE OR REPLACE FUNCTION log_captcha_attempt(
  p_email TEXT DEFAULT NULL,
  p_attempt_type TEXT DEFAULT 'unknown',
  p_failed_attempts_count INTEGER DEFAULT 0,
  p_captcha_question TEXT DEFAULT NULL,
  p_captcha_answer TEXT DEFAULT NULL,
  p_user_answer TEXT DEFAULT NULL,
  p_is_successful BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO captcha_attempts (
    email,
    ip_address,
    user_agent,
    attempt_type,
    failed_attempts_count,
    captcha_question,
    captcha_answer,
    user_answer,
    is_successful
  ) VALUES (
    p_email,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    p_attempt_type,
    p_failed_attempts_count,
    p_captcha_question,
    p_captcha_answer,
    p_user_answer,
    p_is_successful
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to get CAPTCHA statistics
CREATE OR REPLACE FUNCTION get_captcha_statistics(
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_attempts BIGINT,
  successful_attempts BIGINT,
  failed_attempts BIGINT,
  captcha_triggered_count BIGINT,
  unique_ips BIGINT,
  unique_emails BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE is_successful = TRUE) as successful_attempts,
    COUNT(*) FILTER (WHERE is_successful = FALSE) as failed_attempts,
    COUNT(*) FILTER (WHERE attempt_type = 'captcha_triggered') as captcha_triggered_count,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT email) FILTER (WHERE email IS NOT NULL) as unique_emails
  FROM captcha_attempts
  WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL;
END;
$$;

-- 4. Create indexes for performance
-- =====================================================

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_captcha_attempts_created_at ON captcha_attempts(created_at);

-- Index on email for user-specific queries
CREATE INDEX IF NOT EXISTS idx_captcha_attempts_email ON captcha_attempts(email);

-- Index on ip_address for IP-based queries
CREATE INDEX IF NOT EXISTS idx_captcha_attempts_ip ON captcha_attempts(ip_address);

-- Index on attempt_type for filtering
CREATE INDEX IF NOT EXISTS idx_captcha_attempts_type ON captcha_attempts(attempt_type);

-- 5. Create CAPTCHA configuration settings
-- =====================================================

-- Insert CAPTCHA configuration
INSERT INTO system_settings (setting_type, settings, created_at, updated_at)
VALUES (
  'captcha_config',
  '{
    "threshold": 5,
    "timeout_minutes": 60,
    "max_attempts_per_hour": 10,
    "enabled": true,
    "math_operations": ["+", "-", "×"],
    "number_range": {"min": 1, "max": 10}
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (setting_type) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Display completion message
SELECT 'Smart CAPTCHA Security Logging Setup Complete!' as status;

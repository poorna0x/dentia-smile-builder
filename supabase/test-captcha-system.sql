-- 🧪 Test Smart CAPTCHA System
-- =====================================================
--
-- This script tests the CAPTCHA system functionality
-- =====================================================

-- 1. Test CAPTCHA configuration
-- =====================================================

SELECT 'Testing CAPTCHA Configuration...' as test_step;

SELECT 
  setting_type,
  settings->>'threshold' as threshold,
  settings->>'enabled' as enabled
FROM system_settings 
WHERE setting_type = 'captcha_config';

-- 2. Test CAPTCHA logging function
-- =====================================================

SELECT 'Testing CAPTCHA Logging Function...' as test_step;

-- Test successful CAPTCHA verification
SELECT log_captcha_attempt(
  p_email := 'test@example.com',
  p_attempt_type := 'captcha_verification_success',
  p_failed_attempts_count := 5,
  p_captcha_question := '3 + 4 = ?',
  p_captcha_answer := '7',
  p_user_answer := '7',
  p_is_successful := true
) as success_log_id;

-- Test failed CAPTCHA verification
SELECT log_captcha_attempt(
  p_email := 'test@example.com',
  p_attempt_type := 'captcha_verification_failed',
  p_failed_attempts_count := 5,
  p_captcha_question := '3 + 4 = ?',
  p_captcha_answer := '7',
  p_user_answer := '8',
  p_is_successful := false
) as failed_log_id;

-- Test failed login attempt
SELECT log_captcha_attempt(
  p_email := 'test@example.com',
  p_attempt_type := 'login_failed',
  p_failed_attempts_count := 3,
  p_is_successful := false
) as login_failed_log_id;

-- 3. Test CAPTCHA statistics function
-- =====================================================

SELECT 'Testing CAPTCHA Statistics...' as test_step;

SELECT * FROM get_captcha_statistics(1); -- Last 1 day

-- 4. View recent CAPTCHA attempts
-- =====================================================

SELECT 'Recent CAPTCHA Attempts:' as test_step;

SELECT 
  email,
  attempt_type,
  failed_attempts_count,
  is_successful,
  created_at
FROM captcha_attempts 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Test CAPTCHA events configuration
-- =====================================================

SELECT 'Testing CAPTCHA Events Configuration...' as test_step;

SELECT 
  setting_type,
  settings
FROM system_settings 
WHERE setting_type = 'captcha_events';

-- Display completion message
SELECT 'CAPTCHA System Test Complete!' as status;

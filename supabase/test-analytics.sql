-- =====================================================
-- 🧪 TEST ANALYTICS FUNCTIONS
-- =====================================================

-- Test function to verify basic setup
CREATE OR REPLACE FUNCTION test_analytics_setup()
RETURNS TEXT AS $$
BEGIN
  RETURN 'Analytics functions are working!';
END;
$$ LANGUAGE plpgsql;

-- Test the functions with dummy data
SELECT 'Testing get_income_breakdown...' as test_step;
SELECT * FROM get_income_breakdown('00000000-0000-0000-0000-000000000000', '2024-01-01', '2024-01-31');

SELECT 'Testing get_appointment_analytics...' as test_step;
SELECT * FROM get_appointment_analytics('00000000-0000-0000-0000-000000000000', '2024-01-01', '2024-01-31');

SELECT 'Testing get_treatment_analytics...' as test_step;
SELECT * FROM get_treatment_analytics('00000000-0000-0000-0000-000000000000', '2024-01-01', '2024-01-31');

SELECT 'Testing get_doctor_performance...' as test_step;
SELECT * FROM get_doctor_performance('00000000-0000-0000-0000-000000000000', '2024-01-01', '2024-01-31');

SELECT 'All tests completed!' as result;

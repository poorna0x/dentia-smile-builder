-- =====================================================
-- 🏥 FIXED TREATMENT ANALYTICS FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_treatment_analytics(UUID, DATE, DATE);

-- Create fixed treatment analytics function
CREATE OR REPLACE FUNCTION get_treatment_analytics(
  clinic_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  total_treatments BIGINT,
  total_revenue DECIMAL(10,2),
  average_treatment_value DECIMAL(10,2),
  treatment_breakdown JSON
) AS $$
BEGIN
  -- Check if dental_treatments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dental_treatments') THEN
    RETURN QUERY
    WITH treatment_stats AS (
      SELECT 
        COUNT(*) as total_treatments,
        COALESCE(SUM(cost), 0) as total_revenue,
        COALESCE(AVG(cost), 0) as avg_value
      FROM dental_treatments
      WHERE clinic_id = clinic_uuid
      AND treatment_date BETWEEN start_date AND end_date
    ),
    treatment_types AS (
      SELECT 
        treatment_type,
        COUNT(*) as count,
        SUM(cost) as revenue
      FROM dental_treatments
      WHERE clinic_id = clinic_uuid
      AND treatment_date BETWEEN start_date AND end_date
      GROUP BY treatment_type
    )
    SELECT 
      ts.total_treatments::BIGINT,
      ts.total_revenue,
      ts.avg_value,
      COALESCE(
        (SELECT json_object_agg(tt.treatment_type, json_build_object('count', tt.count, 'revenue', tt.revenue))
         FROM treatment_types tt),
        '{}'::json
      ) as treatment_breakdown
    FROM treatment_stats ts;
  ELSE
    -- Return empty data if table doesn't exist
    RETURN QUERY SELECT 
      0::BIGINT as total_treatments,
      0.00 as total_revenue,
      0.00 as average_treatment_value,
      '{}'::json as treatment_breakdown;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_treatment_analytics(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_treatment_analytics(UUID, DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_treatment_analytics(UUID, DATE, DATE) TO service_role;

-- Test the function
SELECT 'Testing fixed treatment analytics function...' as test_step;

-- Test with sample data
DO $$
DECLARE
  clinic_uuid UUID;
BEGIN
  -- Get a clinic
  SELECT id INTO clinic_uuid FROM clinics LIMIT 1;
  
  IF clinic_uuid IS NOT NULL THEN
    -- Test the function
    PERFORM * FROM get_treatment_analytics(clinic_uuid, '2024-01-01', '2024-12-31');
    RAISE NOTICE '✅ Fixed treatment analytics function tested successfully for clinic: %', clinic_uuid;
  ELSE
    RAISE NOTICE '⚠️ No clinics found for testing';
  END IF;
END $$;

-- Success message
SELECT '🎉 Fixed treatment analytics function created successfully!' as status;

-- =====================================================
-- 🏥 FIXED DOCTOR ANALYTICS FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_enhanced_doctor_analytics(UUID, TEXT, TEXT);

-- Create fixed doctor analytics function
CREATE OR REPLACE FUNCTION get_enhanced_doctor_analytics(
  clinic_uuid UUID,
  start_date TEXT,
  end_date TEXT
)
RETURNS TABLE (
  doctor_id UUID,
  doctor_name TEXT,
  treatments_started INTEGER,
  treatments_completed INTEGER,
  treatments_assisted INTEGER,
  total_revenue NUMERIC,
  treatment_breakdown JSONB,
  recent_treatments JSONB,
  attribution_details JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH doctor_stats AS (
    SELECT 
      d.id as doctor_id,
      d.name as doctor_name,
      COUNT(CASE WHEN da.attribution_type = 'Started' THEN 1 END) as treatments_started,
      COUNT(CASE WHEN da.attribution_type = 'Completed' THEN 1 END) as treatments_completed,
      COUNT(CASE WHEN da.attribution_type = 'Assisted' THEN 1 END) as treatments_assisted,
      COALESCE(SUM(CASE WHEN da.attribution_type IN ('Started', 'Completed') THEN dt.cost * (da.attribution_percentage / 100.0) ELSE 0 END), 0) as total_revenue
    FROM dentists d
    LEFT JOIN doctor_attributions da ON d.id = da.doctor_id
    LEFT JOIN dental_treatments dt ON da.treatment_id = dt.id
    WHERE d.clinic_id = clinic_uuid
      AND dt.treatment_date BETWEEN start_date::DATE AND end_date::DATE
    GROUP BY d.id, d.name
  ),
  treatment_breakdown AS (
    SELECT 
      da.doctor_id,
      dt.treatment_type,
      COUNT(*) as count,
      SUM(dt.cost * (da.attribution_percentage / 100.0)) as revenue,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY da.doctor_id), 2) as percentage
    FROM doctor_attributions da
    JOIN dental_treatments dt ON da.treatment_id = dt.id
    WHERE dt.clinic_id = clinic_uuid
      AND dt.treatment_date BETWEEN start_date::DATE AND end_date::DATE
    GROUP BY da.doctor_id, dt.treatment_type
  ),
  recent_treatments AS (
    SELECT 
      da.doctor_id,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'id', dt.id,
          'treatment_type', dt.treatment_type,
          'patient_id', dt.patient_id,
          'treatment_date', dt.treatment_date,
          'status', dt.treatment_status,
          'cost', dt.cost,
          'attribution_type', da.attribution_type
        ) ORDER BY dt.treatment_date DESC
      ) FILTER (WHERE ROW_NUMBER() OVER (PARTITION BY da.doctor_id ORDER BY dt.treatment_date DESC) <= 10) as recent_treatments
    FROM doctor_attributions da
    JOIN dental_treatments dt ON da.treatment_id = dt.id
    WHERE dt.clinic_id = clinic_uuid
      AND dt.treatment_date BETWEEN start_date::DATE AND end_date::DATE
    GROUP BY da.doctor_id
  ),
  attribution_details AS (
    SELECT 
      da.doctor_id,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'treatment_type', dt.treatment_type,
          'attribution_type', da.attribution_type,
          'revenue', dt.cost * (da.attribution_percentage / 100.0),
          'percentage', da.attribution_percentage
        )
      ) as attribution_details
    FROM doctor_attributions da
    JOIN dental_treatments dt ON da.treatment_id = dt.id
    WHERE dt.clinic_id = clinic_uuid
      AND dt.treatment_date BETWEEN start_date::DATE AND end_date::DATE
    GROUP BY da.doctor_id
  )
  SELECT 
    ds.doctor_id,
    ds.doctor_name,
    ds.treatments_started,
    ds.treatments_completed,
    ds.treatments_assisted,
    ds.total_revenue,
    COALESCE(
      (SELECT JSONB_OBJECT_AGG(tb.treatment_type, JSONB_BUILD_OBJECT('count', tb.count, 'revenue', tb.revenue, 'percentage', tb.percentage))
       FROM treatment_breakdown tb WHERE tb.doctor_id = ds.doctor_id),
      '{}'::JSONB
    ) as treatment_breakdown,
    COALESCE(rt.recent_treatments, '[]'::JSONB) as recent_treatments,
    COALESCE(ad.attribution_details, '[]'::JSONB) as attribution_details
  FROM doctor_stats ds
  LEFT JOIN recent_treatments rt ON ds.doctor_id = rt.doctor_id
  LEFT JOIN attribution_details ad ON ds.doctor_id = ad.doctor_id
  ORDER BY ds.total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_enhanced_doctor_analytics(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_enhanced_doctor_analytics(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_enhanced_doctor_analytics(UUID, TEXT, TEXT) TO service_role;

-- Test the function
SELECT 'Testing fixed doctor analytics function...' as test_step;

-- Test with sample data
DO $$
DECLARE
  clinic_uuid UUID;
BEGIN
  -- Get a clinic
  SELECT id INTO clinic_uuid FROM clinics LIMIT 1;
  
  IF clinic_uuid IS NOT NULL THEN
    -- Test the function
    PERFORM * FROM get_enhanced_doctor_analytics(clinic_uuid, '2024-01-01', '2024-12-31');
    RAISE NOTICE '✅ Fixed doctor analytics function tested successfully for clinic: %', clinic_uuid;
  ELSE
    RAISE NOTICE '⚠️ No clinics found for testing';
  END IF;
END $$;

-- Success message
SELECT '🎉 Fixed doctor analytics function created successfully!' as status;

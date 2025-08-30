-- =====================================================
-- 📊 WORKING ANALYTICS FUNCTIONS - ACTUAL SCHEMA
-- =====================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS get_income_breakdown(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_doctor_performance(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_appointment_analytics(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_treatment_analytics(UUID, DATE, DATE);

-- Working income breakdown function
CREATE OR REPLACE FUNCTION get_income_breakdown(
  clinic_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  total_income DECIMAL(10,2),
  cash_amount DECIMAL(10,2),
  upi_amount DECIMAL(10,2),
  card_amount DECIMAL(10,2),
  payment_methods JSON
) AS $$
BEGIN
  -- Check if treatment_payments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treatment_payments') THEN
    RETURN QUERY
    WITH payment_summary AS (
      SELECT 
        COALESCE(SUM(tp.paid_amount), 0) as total_income,
        COALESCE(SUM(CASE WHEN pt.notes ILIKE '%cash%' THEN pt.amount ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN pt.notes ILIKE '%upi%' THEN pt.amount ELSE 0 END), 0) as upi_amount,
        COALESCE(SUM(CASE WHEN pt.notes ILIKE '%card%' THEN pt.amount ELSE 0 END), 0) as card_amount
      FROM treatment_payments tp
      LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
      WHERE tp.clinic_id = clinic_uuid
      AND pt.payment_date BETWEEN start_date AND end_date
    )
    SELECT 
      ps.total_income,
      ps.cash_amount,
      ps.upi_amount,
      ps.card_amount,
      json_build_object(
        'cash', CASE WHEN ps.cash_amount > 0 THEN json_build_object('amount', ps.cash_amount, 'percentage', ROUND((ps.cash_amount / NULLIF(ps.total_income, 0)) * 100, 2)) ELSE NULL END,
        'upi', CASE WHEN ps.upi_amount > 0 THEN json_build_object('amount', ps.upi_amount, 'percentage', ROUND((ps.upi_amount / NULLIF(ps.total_income, 0)) * 100, 2)) ELSE NULL END,
        'card', CASE WHEN ps.card_amount > 0 THEN json_build_object('amount', ps.card_amount, 'percentage', ROUND((ps.card_amount / NULLIF(ps.total_income, 0)) * 100, 2)) ELSE NULL END
      ) as payment_methods
    FROM payment_summary ps;
  ELSE
    -- Return empty data if table doesn't exist
    RETURN QUERY SELECT 
      0.00 as total_income,
      0.00 as cash_amount,
      0.00 as upi_amount,
      0.00 as card_amount,
      '{}'::json as payment_methods;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Working doctor performance function
CREATE OR REPLACE FUNCTION get_doctor_performance(
  clinic_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  doctor_id UUID,
  doctor_name VARCHAR(255),
  treatments_started BIGINT,
  treatments_completed BIGINT,
  treatments_assisted BIGINT,
  total_revenue DECIMAL(10,2),
  attribution_details JSON
) AS $$
BEGIN
  -- Check if dentists table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dentists') THEN
    RETURN QUERY
    SELECT 
      d.id as doctor_id,
      d.name as doctor_name,
      COUNT(CASE WHEN da.attribution_type = 'Started' THEN 1 END)::BIGINT as treatments_started,
      COUNT(CASE WHEN da.attribution_type = 'Completed' THEN 1 END)::BIGINT as treatments_completed,
      COUNT(CASE WHEN da.attribution_type = 'Assisted' THEN 1 END)::BIGINT as treatments_assisted,
      COALESCE(SUM(
        CASE 
          WHEN da.attribution_type = 'Completed' THEN (COALESCE(tp.paid_amount, 0) * da.attribution_percentage / 100)
          WHEN da.attribution_type = 'Started' THEN (COALESCE(tp.paid_amount, 0) * da.attribution_percentage / 100)
          ELSE 0 
        END
      ), 0) as total_revenue,
      COALESCE(json_agg(
        json_build_object(
          'treatment_id', da.treatment_id,
          'attribution_type', da.attribution_type,
          'attribution_percentage', da.attribution_percentage,
          'amount', COALESCE(tp.paid_amount, 0),
          'attributed_amount', (COALESCE(tp.paid_amount, 0) * da.attribution_percentage / 100)
        )
      ) FILTER (WHERE da.treatment_id IS NOT NULL), '[]'::json) as attribution_details
    FROM dentists d
    LEFT JOIN doctor_attributions da ON d.id = da.doctor_id
    LEFT JOIN treatment_payments tp ON da.treatment_id = tp.treatment_id
    WHERE d.clinic_id = clinic_uuid
    AND (da.created_at::DATE BETWEEN start_date AND end_date OR da.created_at IS NULL)
    AND (tp.payment_date BETWEEN start_date AND end_date OR tp.payment_date IS NULL)
    GROUP BY d.id, d.name
    ORDER BY total_revenue DESC;
  ELSE
    -- Return empty data if table doesn't exist
    RETURN QUERY SELECT 
      NULL::UUID as doctor_id,
      ''::VARCHAR as doctor_name,
      0::BIGINT as treatments_started,
      0::BIGINT as treatments_completed,
      0::BIGINT as treatments_assisted,
      0.00 as total_revenue,
      '[]'::json as attribution_details
    WHERE FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Working appointment analytics function
CREATE OR REPLACE FUNCTION get_appointment_analytics(
  clinic_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  total_appointments BIGINT,
  completed_appointments BIGINT,
  cancelled_appointments BIGINT,
  rescheduled_appointments BIGINT,
  no_show_appointments BIGINT,
  completion_rate DECIMAL(5,2),
  cancellation_rate DECIMAL(5,2),
  status_breakdown JSON
) AS $$
BEGIN
  -- Check if appointments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    RETURN QUERY
    WITH appointment_stats AS (
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'Rescheduled' THEN 1 END) as rescheduled,
        COUNT(CASE WHEN status = 'No Show' THEN 1 END) as no_show
      FROM appointments
      WHERE clinic_id = clinic_uuid
      AND date BETWEEN start_date AND end_date
    )
    SELECT 
      stats.total::BIGINT,
      stats.completed::BIGINT,
      stats.cancelled::BIGINT,
      stats.rescheduled::BIGINT,
      stats.no_show::BIGINT,
      ROUND((stats.completed::DECIMAL / NULLIF(stats.total, 0)) * 100, 2) as completion_rate,
      ROUND((stats.cancelled::DECIMAL / NULLIF(stats.total, 0)) * 100, 2) as cancellation_rate,
      json_build_object(
        'completed', json_build_object('count', stats.completed, 'percentage', ROUND((stats.completed::DECIMAL / NULLIF(stats.total, 0)) * 100, 2)),
        'cancelled', json_build_object('count', stats.cancelled, 'percentage', ROUND((stats.cancelled::DECIMAL / NULLIF(stats.total, 0)) * 100, 2)),
        'rescheduled', json_build_object('count', stats.rescheduled, 'percentage', ROUND((stats.rescheduled::DECIMAL / NULLIF(stats.total, 0)) * 100, 2)),
        'no_show', json_build_object('count', stats.no_show, 'percentage', ROUND((stats.no_show::DECIMAL / NULLIF(stats.total, 0)) * 100, 2))
      ) as status_breakdown
    FROM appointment_stats stats;
  ELSE
    -- Return empty data if table doesn't exist
    RETURN QUERY SELECT 
      0::BIGINT as total_appointments,
      0::BIGINT as completed_appointments,
      0::BIGINT as cancelled_appointments,
      0::BIGINT as rescheduled_appointments,
      0::BIGINT as no_show_appointments,
      0.00 as completion_rate,
      0.00 as cancellation_rate,
      '{}'::json as status_breakdown;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Working treatment analytics function (simplified)
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
  -- Check if treatment_payments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treatment_payments') THEN
    RETURN QUERY
    WITH treatment_stats AS (
      SELECT 
        COUNT(*) as total_treatments,
        COALESCE(SUM(paid_amount), 0) as total_revenue,
        COALESCE(AVG(paid_amount), 0) as avg_value
      FROM treatment_payments
      WHERE clinic_id = clinic_uuid
      AND (payment_date BETWEEN start_date AND end_date OR payment_date IS NULL)
    )
    SELECT 
      ts.total_treatments::BIGINT,
      ts.total_revenue,
      ts.avg_value,
      '{}'::json as treatment_breakdown
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

-- Success message
SELECT 'Working analytics functions created successfully!' as status;

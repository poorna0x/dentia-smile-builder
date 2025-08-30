-- =====================================================
-- 📊 ANALYTICS SYSTEM SETUP FOR DENTAL CLINIC (SAFE VERSION)
-- =====================================================
-- This version handles existing objects and won't fail if parts are already created

-- Step 1: Create ENUM for doctor attribution types (safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doctor_attribution_type') THEN
        CREATE TYPE doctor_attribution_type AS ENUM ('Started', 'Completed', 'Assisted');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- ENUM already exists, continue
        NULL;
END $$;

-- Step 2: Create doctor attribution table for multi-doctor procedures (safe)
CREATE TABLE IF NOT EXISTS doctor_attributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES dental_treatments(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  attribution_type doctor_attribution_type NOT NULL,
  attribution_percentage DECIMAL(5,2) DEFAULT 100.00 CHECK (attribution_percentage >= 0 AND attribution_percentage <= 100),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create analytics cache table for performance (safe)
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  cache_key VARCHAR(255) NOT NULL,
  cache_data JSONB NOT NULL,
  cache_date DATE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, cache_key, cache_date)
);

-- Step 4: Create indexes for performance (safe)
CREATE INDEX IF NOT EXISTS idx_doctor_attributions_treatment_id ON doctor_attributions(treatment_id);
CREATE INDEX IF NOT EXISTS idx_doctor_attributions_doctor_id ON doctor_attributions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_attributions_clinic_id ON doctor_attributions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctor_attributions_type ON doctor_attributions(attribution_type);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_clinic_date ON analytics_cache(clinic_id, cache_date);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

-- Step 5: Create functions for analytics calculations (safe - drop first if exists)

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_income_breakdown(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_doctor_performance(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_appointment_analytics(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_treatment_analytics(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS cache_analytics_data(UUID, VARCHAR, DATE, DATE);

-- Function to get income breakdown for a date range
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
END;
$$ LANGUAGE plpgsql;

-- Function to get doctor performance analytics
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
  RETURN QUERY
  SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    COUNT(CASE WHEN da.attribution_type = 'Started' THEN 1 END)::BIGINT as treatments_started,
    COUNT(CASE WHEN da.attribution_type = 'Completed' THEN 1 END)::BIGINT as treatments_completed,
    COUNT(CASE WHEN da.attribution_type = 'Assisted' THEN 1 END)::BIGINT as treatments_assisted,
    COALESCE(SUM(
      CASE 
        WHEN da.attribution_type = 'Completed' THEN (tp.paid_amount * da.attribution_percentage / 100)
        WHEN da.attribution_type = 'Started' THEN (tp.paid_amount * da.attribution_percentage / 100)
        ELSE 0 
      END
    ), 0) as total_revenue,
    json_agg(
      json_build_object(
        'treatment_id', dt.id,
        'treatment_name', dt.treatment_name,
        'attribution_type', da.attribution_type,
        'attribution_percentage', da.attribution_percentage,
        'amount', tp.paid_amount,
        'attributed_amount', (tp.paid_amount * da.attribution_percentage / 100)
      )
    ) as attribution_details
  FROM dentists d
  LEFT JOIN doctor_attributions da ON d.id = da.doctor_id
  LEFT JOIN dental_treatments dt ON da.treatment_id = dt.id
  LEFT JOIN treatment_payments tp ON dt.id = tp.treatment_id
  WHERE d.clinic_id = clinic_uuid
  AND (da.created_at::DATE BETWEEN start_date AND end_date OR da.created_at IS NULL)
  AND (tp.payment_date BETWEEN start_date AND end_date OR tp.payment_date IS NULL)
  GROUP BY d.id, d.name
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get appointment analytics
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
END;
$$ LANGUAGE plpgsql;

-- Function to get treatment analytics
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
  RETURN QUERY
  WITH treatment_stats AS (
    SELECT 
      COUNT(*) as total_treatments,
      COALESCE(SUM(tp.paid_amount), 0) as total_revenue,
      COALESCE(AVG(tp.paid_amount), 0) as avg_value
    FROM dental_treatments dt
    LEFT JOIN treatment_payments tp ON dt.id = tp.treatment_id
    WHERE dt.clinic_id = clinic_uuid
    AND (dt.created_at::DATE BETWEEN start_date AND end_date)
    AND (tp.payment_date BETWEEN start_date AND end_date OR tp.payment_date IS NULL)
  ),
  treatment_types AS (
    SELECT 
      dt.treatment_name,
      COUNT(*) as count,
      COALESCE(SUM(tp.paid_amount), 0) as revenue
    FROM dental_treatments dt
    LEFT JOIN treatment_payments tp ON dt.id = tp.treatment_id
    WHERE dt.clinic_id = clinic_uuid
    AND (dt.created_at::DATE BETWEEN start_date AND end_date)
    AND (tp.payment_date BETWEEN start_date AND end_date OR tp.payment_date IS NULL)
    GROUP BY dt.treatment_name
  )
  SELECT 
    ts.total_treatments::BIGINT,
    ts.total_revenue,
    ts.avg_value,
    json_object_agg(
      tt.treatment_name, 
      json_build_object('count', tt.count, 'revenue', tt.revenue, 'percentage', ROUND((tt.count::DECIMAL / NULLIF(ts.total_treatments, 0)) * 100, 2))
    ) as treatment_breakdown
  FROM treatment_stats ts
  CROSS JOIN treatment_types tt
  GROUP BY ts.total_treatments, ts.total_revenue, ts.avg_value;
END;
$$ LANGUAGE plpgsql;

-- Function to cache analytics data
CREATE OR REPLACE FUNCTION cache_analytics_data(
  clinic_uuid UUID,
  cache_key_param VARCHAR(255),
  start_date DATE,
  end_date DATE
)
RETURNS void AS $$
DECLARE
  cache_data JSONB;
BEGIN
  -- Generate cache data based on key
  CASE cache_key_param
    WHEN 'income_breakdown' THEN
      SELECT json_build_object(
        'income_breakdown', (SELECT row_to_json(t) FROM get_income_breakdown(clinic_uuid, start_date, end_date) t)
      ) INTO cache_data;
    
    WHEN 'doctor_performance' THEN
      SELECT json_build_object(
        'doctor_performance', (SELECT json_agg(row_to_json(t)) FROM get_doctor_performance(clinic_uuid, start_date, end_date) t)
      ) INTO cache_data;
    
    WHEN 'appointment_analytics' THEN
      SELECT json_build_object(
        'appointment_analytics', (SELECT row_to_json(t) FROM get_appointment_analytics(clinic_uuid, start_date, end_date) t)
      ) INTO cache_data;
    
    WHEN 'treatment_analytics' THEN
      SELECT json_build_object(
        'treatment_analytics', (SELECT row_to_json(t) FROM get_treatment_analytics(clinic_uuid, start_date, end_date) t)
      ) INTO cache_data;
    
    ELSE
      RAISE EXCEPTION 'Unknown cache key: %', cache_key_param;
  END CASE;

  -- Insert or update cache
  INSERT INTO analytics_cache (clinic_id, cache_key, cache_data, cache_date, expires_at)
  VALUES (clinic_uuid, cache_key_param, cache_data, start_date, NOW() + INTERVAL '24 hours')
  ON CONFLICT (clinic_id, cache_key, cache_date)
  DO UPDATE SET 
    cache_data = EXCLUDED.cache_data,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers (safe - drop first if exists)
DROP TRIGGER IF EXISTS update_doctor_attributions_updated_at ON doctor_attributions;
CREATE TRIGGER update_doctor_attributions_updated_at 
  BEFORE UPDATE ON doctor_attributions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable Row Level Security (safe)
ALTER TABLE doctor_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies (safe - drop first if exists)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON doctor_attributions;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON analytics_cache;

CREATE POLICY "Enable all access for authenticated users" ON doctor_attributions
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON analytics_cache
FOR ALL USING (auth.role() = 'authenticated');

-- Step 9: Grant permissions (safe)
GRANT ALL ON doctor_attributions TO authenticated;
GRANT ALL ON analytics_cache TO authenticated;

-- Success message
SELECT 'Analytics system setup completed successfully!' as status;

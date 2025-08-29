-- =====================================================
-- 🦷 PAYMENT SYSTEM - WITH PAYMENT MODES SUPPORT
-- =====================================================

-- Add payment_mode column to payment_transactions table
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'Cash' 
CHECK (payment_mode IN ('Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Insurance', 'Other'));

-- Create index for payment mode analytics
CREATE INDEX IF NOT EXISTS idx_payment_transactions_mode ON payment_transactions(payment_mode);

-- Update the payment summary function to include payment mode analytics
CREATE OR REPLACE FUNCTION get_treatment_payment_summary_with_modes(treatment_uuid UUID)
RETURNS TABLE (
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  remaining_amount DECIMAL(10,2),
  payment_status TEXT,
  transaction_count BIGINT,
  payment_modes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.total_amount,
    tp.paid_amount,
    tp.remaining_amount,
    tp.payment_status,
    COUNT(pt.id)::BIGINT as transaction_count,
    COALESCE(
      jsonb_object_agg(
        pt.payment_mode, 
        COALESCE(payment_mode_totals.total_amount, 0)
      ) FILTER (WHERE pt.payment_mode IS NOT NULL),
      '{}'::jsonb
    ) as payment_modes
  FROM treatment_payments tp
  LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
  LEFT JOIN (
    SELECT 
      treatment_payment_id,
      payment_mode,
      SUM(amount) as total_amount
    FROM payment_transactions 
    WHERE treatment_payment_id IN (
      SELECT id FROM treatment_payments WHERE treatment_id = treatment_uuid
    )
    GROUP BY treatment_payment_id, payment_mode
  ) payment_mode_totals ON pt.treatment_payment_id = payment_mode_totals.treatment_payment_id 
    AND pt.payment_mode = payment_mode_totals.payment_mode
  WHERE tp.treatment_id = treatment_uuid
  GROUP BY tp.id, tp.total_amount, tp.paid_amount, tp.remaining_amount, tp.payment_status;
END;
$$ LANGUAGE plpgsql;

-- Create function to get payment analytics by clinic
CREATE OR REPLACE FUNCTION get_clinic_payment_analytics(clinic_uuid UUID, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
  payment_mode TEXT,
  total_amount DECIMAL(10,2),
  transaction_count BIGINT,
  percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH payment_totals AS (
    SELECT 
      payment_mode,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM payment_transactions pt
    JOIN treatment_payments tp ON pt.treatment_payment_id = tp.id
    WHERE tp.clinic_id = clinic_uuid
      AND (start_date IS NULL OR pt.payment_date >= start_date)
      AND (end_date IS NULL OR pt.payment_date <= end_date)
    GROUP BY payment_mode
  ),
  grand_total AS (
    SELECT SUM(total_amount) as total
    FROM payment_totals
  )
  SELECT 
    pt.payment_mode,
    pt.total_amount,
    pt.transaction_count,
    ROUND((pt.total_amount / gt.total) * 100, 2) as percentage
  FROM payment_totals pt
  CROSS JOIN grand_total gt
  ORDER BY pt.total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get patient payment analytics
CREATE OR REPLACE FUNCTION get_patient_payment_analytics(patient_uuid UUID, clinic_uuid UUID)
RETURNS TABLE (
  payment_mode TEXT,
  total_amount DECIMAL(10,2),
  transaction_count BIGINT,
  percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH payment_totals AS (
    SELECT 
      payment_mode,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM payment_transactions pt
    JOIN treatment_payments tp ON pt.treatment_payment_id = tp.id
    WHERE tp.patient_id = patient_uuid AND tp.clinic_id = clinic_uuid
    GROUP BY payment_mode
  ),
  grand_total AS (
    SELECT SUM(total_amount) as total
    FROM payment_totals
  )
  SELECT 
    pt.payment_mode,
    pt.total_amount,
    pt.transaction_count,
    ROUND((pt.total_amount / gt.total) * 100, 2) as percentage
  FROM payment_totals pt
  CROSS JOIN grand_total gt
  ORDER BY pt.total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get daily payment analytics
CREATE OR REPLACE FUNCTION get_daily_payment_analytics(clinic_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  payment_date DATE,
  payment_mode TEXT,
  total_amount DECIMAL(10,2),
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.payment_date,
    pt.payment_mode,
    SUM(pt.amount) as total_amount,
    COUNT(*) as transaction_count
  FROM payment_transactions pt
  JOIN treatment_payments tp ON pt.treatment_payment_id = tp.id
  WHERE tp.clinic_id = clinic_uuid
    AND pt.payment_date >= CURRENT_DATE - days_back
  GROUP BY pt.payment_date, pt.payment_mode
  ORDER BY pt.payment_date DESC, total_amount DESC;
END;
$$ LANGUAGE plpgsql;

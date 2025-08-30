-- =====================================================
-- 💰 IMPROVED INCOME ANALYTICS - BETTER PAYMENT METHOD DETECTION
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_income_breakdown(UUID, DATE, DATE);

-- Improved income breakdown function
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
        -- Try to detect payment methods from notes or other fields
        COALESCE(SUM(
          CASE 
            WHEN pt.notes ILIKE '%cash%' OR pt.notes ILIKE '%cash payment%' THEN pt.amount
            WHEN pt.notes IS NULL OR pt.notes = '' THEN pt.amount -- Assume cash if no method specified
            ELSE 0 
          END
        ), 0) as cash_amount,
        COALESCE(SUM(
          CASE 
            WHEN pt.notes ILIKE '%upi%' OR pt.notes ILIKE '%unified payment%' OR pt.notes ILIKE '%phonepe%' OR pt.notes ILIKE '%gpay%' OR pt.notes ILIKE '%paytm%' THEN pt.amount
            ELSE 0 
          END
        ), 0) as upi_amount,
        COALESCE(SUM(
          CASE 
            WHEN pt.notes ILIKE '%card%' OR pt.notes ILIKE '%credit%' OR pt.notes ILIKE '%debit%' OR pt.notes ILIKE '%swipe%' THEN pt.amount
            ELSE 0 
          END
        ), 0) as card_amount
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

-- Function to add payment method to transactions
CREATE OR REPLACE FUNCTION add_payment_method(
  transaction_id UUID,
  payment_method TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE payment_transactions 
  SET notes = COALESCE(notes, '') || ' | Payment Method: ' || payment_method
  WHERE id = transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get payment method breakdown for a specific date range
CREATE OR REPLACE FUNCTION get_payment_method_breakdown(
  clinic_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  payment_method TEXT,
  total_amount DECIMAL(10,2),
  transaction_count BIGINT,
  percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH method_breakdown AS (
    SELECT 
      CASE 
        WHEN pt.notes ILIKE '%cash%' OR pt.notes ILIKE '%cash payment%' THEN 'Cash'
        WHEN pt.notes ILIKE '%upi%' OR pt.notes ILIKE '%unified payment%' OR pt.notes ILIKE '%phonepe%' OR pt.notes ILIKE '%gpay%' OR pt.notes ILIKE '%paytm%' THEN 'UPI'
        WHEN pt.notes ILIKE '%card%' OR pt.notes ILIKE '%credit%' OR pt.notes ILIKE '%debit%' OR pt.notes ILIKE '%swipe%' THEN 'Card'
        WHEN pt.notes IS NULL OR pt.notes = '' THEN 'Cash' -- Default to cash if no method specified
        ELSE 'Other'
      END as payment_method,
      pt.amount,
      pt.id
    FROM treatment_payments tp
    LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
    WHERE tp.clinic_id = clinic_uuid
    AND pt.payment_date BETWEEN start_date AND end_date
  ),
  summary AS (
    SELECT 
      payment_method,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM method_breakdown
    GROUP BY payment_method
  )
  SELECT 
    s.payment_method,
    s.total_amount,
    s.transaction_count,
    ROUND((s.total_amount / NULLIF((SELECT SUM(total_amount) FROM summary), 0)) * 100, 2) as percentage
  FROM summary s
  ORDER BY s.total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Improved income analytics functions created successfully!' as status;

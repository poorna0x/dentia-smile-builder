-- =====================================================
-- 💰 FINAL INCOME ANALYTICS - USING PAYMENT METHOD COLUMN
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_income_breakdown(UUID, DATE, DATE);

-- Final income breakdown function using payment_method column
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
        -- Use the payment_method column for accurate breakdown
        COALESCE(SUM(
          CASE 
            WHEN pt.payment_method = 'Cash' THEN pt.amount
            ELSE 0 
          END
        ), 0) as cash_amount,
        COALESCE(SUM(
          CASE 
            WHEN pt.payment_method = 'UPI' THEN pt.amount
            ELSE 0 
          END
        ), 0) as upi_amount,
        COALESCE(SUM(
          CASE 
            WHEN pt.payment_method = 'Card' THEN pt.amount
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

-- Function to update payment method for existing transactions
CREATE OR REPLACE FUNCTION update_payment_method(
  transaction_id UUID,
  new_payment_method VARCHAR(50)
)
RETURNS void AS $$
BEGIN
  -- Validate payment method
  IF new_payment_method NOT IN ('Cash', 'UPI', 'Card', 'Other') THEN
    RAISE EXCEPTION 'Invalid payment method. Must be Cash, UPI, Card, or Other';
  END IF;
  
  UPDATE payment_transactions 
  SET payment_method = new_payment_method
  WHERE id = transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get detailed payment method breakdown
CREATE OR REPLACE FUNCTION get_detailed_payment_breakdown(
  clinic_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  payment_method VARCHAR(50),
  total_amount DECIMAL(10,2),
  transaction_count BIGINT,
  percentage DECIMAL(5,2),
  average_amount DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH method_breakdown AS (
    SELECT 
      pt.payment_method,
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
      COUNT(*) as transaction_count,
      AVG(amount) as average_amount
    FROM method_breakdown
    GROUP BY payment_method
  )
  SELECT 
    s.payment_method,
    s.total_amount,
    s.transaction_count,
    ROUND((s.total_amount / NULLIF((SELECT SUM(total_amount) FROM summary), 0)) * 100, 2) as percentage,
    s.average_amount
  FROM summary s
  ORDER BY s.total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to add sample payment data for testing
CREATE OR REPLACE FUNCTION add_sample_payment_data(
  clinic_uuid UUID
)
RETURNS void AS $$
DECLARE
  treatment_payment_id UUID;
BEGIN
  -- First, create a sample treatment payment
  INSERT INTO treatment_payments (treatment_id, clinic_id, patient_id, total_amount, paid_amount, payment_status)
  VALUES (
    (SELECT id FROM dental_treatments WHERE clinic_id = clinic_uuid LIMIT 1),
    clinic_uuid,
    (SELECT id FROM patients WHERE clinic_id = clinic_uuid LIMIT 1),
    5000.00,
    5000.00,
    'Completed'
  ) RETURNING id INTO treatment_payment_id;
  
  -- Add sample payment transactions with different methods
  INSERT INTO payment_transactions (treatment_payment_id, amount, payment_date, payment_method, notes)
  VALUES 
    (treatment_payment_id, 2000.00, CURRENT_DATE, 'Cash', 'Cash payment'),
    (treatment_payment_id, 2000.00, CURRENT_DATE, 'UPI', 'UPI payment via PhonePe'),
    (treatment_payment_id, 1000.00, CURRENT_DATE, 'Card', 'Card payment');
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Final income analytics functions created successfully!' as status;

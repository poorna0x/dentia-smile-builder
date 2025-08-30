-- =====================================================
-- 🔧 FIX PAYMENT SUMMARY CALCULATION
-- =====================================================

-- Drop and recreate the trigger function to ensure it works correctly
DROP TRIGGER IF EXISTS update_treatment_payment_on_transaction_trigger ON payment_transactions;

CREATE OR REPLACE FUNCTION update_treatment_payment_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the treatment payment record with the new total paid amount
  UPDATE treatment_payments 
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM payment_transactions
      WHERE treatment_payment_id = NEW.treatment_payment_id
    ),
    updated_at = NOW()
  WHERE id = NEW.treatment_payment_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER update_treatment_payment_on_transaction_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treatment_payment_on_transaction();

-- Function to recalculate all payment summaries
CREATE OR REPLACE FUNCTION recalculate_all_payment_summaries()
RETURNS void AS $$
BEGIN
  UPDATE treatment_payments 
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM payment_transactions
      WHERE treatment_payment_id = treatment_payments.id
    ),
    updated_at = NOW();
END;
$$ language 'plpgsql';

-- Function to get payment summary for a specific treatment
CREATE OR REPLACE FUNCTION get_treatment_payment_summary(treatment_uuid UUID)
RETURNS TABLE (
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  remaining_amount DECIMAL(10,2),
  payment_status TEXT,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.total_amount,
    tp.paid_amount,
    tp.remaining_amount,
    tp.payment_status,
    COUNT(pt.id)::BIGINT as transaction_count
  FROM treatment_payments tp
  LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
  WHERE tp.treatment_id = treatment_uuid
  GROUP BY tp.id, tp.total_amount, tp.paid_amount, tp.remaining_amount, tp.payment_status;
END;
$$ LANGUAGE plpgsql;

-- Recalculate all existing payment summaries
SELECT recalculate_all_payment_summaries();

-- Success message
SELECT 'Payment summary calculation fixed successfully!' as status;

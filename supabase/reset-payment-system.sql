-- =====================================================
-- 🔄 RESET AND FIX PAYMENT SYSTEM
-- =====================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS update_treatment_payment_on_transaction_trigger ON payment_transactions;
DROP TRIGGER IF EXISTS update_treatment_payment_status ON treatment_payments;

-- Drop all functions
DROP FUNCTION IF EXISTS update_treatment_payment_on_transaction();
DROP FUNCTION IF EXISTS update_payment_status();
DROP FUNCTION IF EXISTS get_treatment_payment_summary(UUID);
DROP FUNCTION IF EXISTS recalculate_all_payment_summaries();

-- Recreate the payment status function
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.payment_status = 'Completed';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.payment_status = 'Partial';
  ELSE
    NEW.payment_status = 'Pending';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the transaction trigger function
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

-- Recreate the payment summary function
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

-- Recreate triggers
CREATE TRIGGER update_treatment_payment_status 
  BEFORE UPDATE ON treatment_payments 
  FOR EACH ROW EXECUTE FUNCTION update_payment_status();

CREATE TRIGGER update_treatment_payment_on_transaction_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treatment_payment_on_transaction();

-- Recalculate all payment summaries
UPDATE treatment_payments 
SET 
  paid_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payment_transactions
    WHERE treatment_payment_id = treatment_payments.id
  ),
  updated_at = NOW();

-- Success message
SELECT 'Payment system reset and fixed successfully!' as status;

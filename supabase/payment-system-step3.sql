-- =====================================================
-- 🦷 PAYMENT SYSTEM - STEP 3: Create Functions and Triggers
-- =====================================================

-- Create functions
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

CREATE OR REPLACE FUNCTION update_treatment_payment_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE treatment_payments 
  SET paid_amount = paid_amount + NEW.amount
  WHERE id = NEW.treatment_payment_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION get_treatment_payment_summary(treatment_uuid UUID)
RETURNS TABLE (
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  remaining_amount DECIMAL(10,2),
  payment_status payment_status,
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

-- Create triggers
DROP TRIGGER IF EXISTS update_treatment_payment_status ON treatment_payments;
CREATE TRIGGER update_treatment_payment_status 
  BEFORE UPDATE ON treatment_payments 
  FOR EACH ROW EXECUTE FUNCTION update_payment_status();

DROP TRIGGER IF EXISTS update_treatment_payment_on_transaction_trigger ON payment_transactions;
CREATE TRIGGER update_treatment_payment_on_transaction_trigger
  AFTER INSERT ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treatment_payment_on_transaction();

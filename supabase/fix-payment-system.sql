-- =====================================================
-- 🔧 FIX PAYMENT SYSTEM - ADD MISSING PAYMENT METHOD COLUMN
-- =====================================================

-- Add payment_method column to payment_transactions table
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash';

-- Add constraint to ensure valid payment methods
DO $$
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_payment_method' 
    AND table_name = 'payment_transactions'
  ) THEN
    ALTER TABLE payment_transactions DROP CONSTRAINT check_payment_method;
  END IF;
  
  -- Add the constraint
  ALTER TABLE payment_transactions 
  ADD CONSTRAINT check_payment_method 
  CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Other'));
END $$;

-- Update existing transactions to have a default payment method
UPDATE payment_transactions 
SET payment_method = 'Cash' 
WHERE payment_method IS NULL OR payment_method = '';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method 
ON payment_transactions(payment_method);

-- Update the payment transaction trigger to handle payment_method
CREATE OR REPLACE FUNCTION update_treatment_payment_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE treatment_payments 
  SET paid_amount = paid_amount + NEW.amount
  WHERE id = NEW.treatment_payment_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Success message
SELECT 'Payment system fixed successfully!' as status;

-- Fix payment trigger issue with generated column
-- The issue is that the trigger is trying to update paid_amount which affects the generated remaining_amount column

-- Step 1: Drop the existing trigger that's causing issues
DROP TRIGGER IF EXISTS update_treatment_payment_on_transaction_trigger ON payment_transactions;

-- Step 2: Create a new, improved trigger function that handles the generated column properly
CREATE OR REPLACE FUNCTION update_treatment_payment_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update only the paid_amount, let the generated column handle remaining_amount
  UPDATE treatment_payments 
  SET 
    paid_amount = paid_amount + NEW.amount,
    updated_at = NOW()
  WHERE id = NEW.treatment_payment_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Recreate the trigger
CREATE TRIGGER update_treatment_payment_on_transaction_trigger
  AFTER INSERT ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treatment_payment_on_transaction();

-- Step 4: Also improve the payment status update function
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate payment status based on paid_amount vs total_amount
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.payment_status = 'Completed';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.payment_status = 'Partial';
  ELSE
    NEW.payment_status = 'Pending';
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_generated,
  generation_expression
FROM information_schema.columns 
WHERE table_name = 'treatment_payments' 
ORDER BY ordinal_position;

-- Step 6: Test the trigger by checking existing data
SELECT 
  'Treatment payments summary' as info,
  COUNT(*) as total_payments,
  SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN payment_status = 'Partial' THEN 1 ELSE 0 END) as partial,
  SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) as completed
FROM treatment_payments;

-- Step 7: Check payment transactions
SELECT 
  'Payment transactions summary' as info,
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount
FROM payment_transactions;

-- Success message
SELECT 'Payment trigger issue fixed successfully!' as status;

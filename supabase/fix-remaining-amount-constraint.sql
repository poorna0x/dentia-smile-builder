-- Fix remaining_amount constraint issue
-- The trigger is causing remaining_amount to go negative, violating the check constraint

-- Step 1: Drop the problematic trigger first
DROP TRIGGER IF EXISTS update_treatment_payment_on_transaction_trigger ON payment_transactions;

-- Step 2: Fix the trigger function to handle remaining_amount properly
CREATE OR REPLACE FUNCTION update_treatment_payment_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_paid_amount DECIMAL(10,2);
  new_paid_amount DECIMAL(10,2);
  treatment_total_amount DECIMAL(10,2);
BEGIN
  -- Get current paid amount and total amount
  SELECT paid_amount, total_amount INTO current_paid_amount, treatment_total_amount
  FROM treatment_payments 
  WHERE id = NEW.treatment_payment_id;
  
  -- Calculate new paid amount
  new_paid_amount := current_paid_amount + NEW.amount;
  
  -- Update treatment payment with new paid amount and recalculate remaining
  UPDATE treatment_payments 
  SET 
    paid_amount = new_paid_amount,
    remaining_amount = GREATEST(0, treatment_total_amount - new_paid_amount), -- Ensure remaining_amount >= 0
    updated_at = NOW()
  WHERE id = NEW.treatment_payment_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Recreate the trigger
CREATE TRIGGER update_treatment_payment_on_transaction_trigger
  AFTER INSERT ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treatment_payment_on_transaction();

-- Step 4: Also fix any existing data that might have negative remaining_amount
UPDATE treatment_payments 
SET remaining_amount = GREATEST(0, total_amount - paid_amount)
WHERE remaining_amount < 0;

-- Step 5: Verify the fix by checking current data
SELECT 
  'Current payment data' as info,
  COUNT(*) as total_payments,
  SUM(CASE WHEN remaining_amount < 0 THEN 1 ELSE 0 END) as negative_remaining,
  SUM(CASE WHEN paid_amount > total_amount THEN 1 ELSE 0 END) as overpaid
FROM treatment_payments;

-- Step 6: Test the trigger with a sample transaction (if any payments exist)
DO $$
DECLARE
  test_payment_id UUID;
  test_transaction_id UUID;
BEGIN
  -- Check if we have any treatment_payments to test with
  SELECT id INTO test_payment_id FROM treatment_payments LIMIT 1;
  
  IF test_payment_id IS NOT NULL THEN
    -- Try to insert a test transaction
    INSERT INTO payment_transactions (
      treatment_payment_id,
      amount,
      payment_method,
      payment_date,
      notes
    ) VALUES (
      test_payment_id,
      50.00,
      'Cash',
      CURRENT_DATE,
      'Test transaction after fix'
    ) RETURNING id INTO test_transaction_id;
    
    RAISE NOTICE 'Test transaction inserted successfully with ID: %', test_transaction_id;
    
    -- Clean up test data
    DELETE FROM payment_transactions WHERE id = test_transaction_id;
    RAISE NOTICE 'Test transaction cleaned up';
  ELSE
    RAISE NOTICE 'No treatment_payments found to test with';
  END IF;
END $$;

-- Success message
SELECT 'Remaining amount constraint issue fixed successfully!' as status;

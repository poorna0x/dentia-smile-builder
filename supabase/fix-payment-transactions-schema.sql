-- Fix payment_transactions table schema
-- Add missing payment_mode column

-- Step 1: Add payment_method column to payment_transactions table
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash';

-- Step 2: Update existing records to have a default payment method
UPDATE payment_transactions 
SET payment_method = 'Cash' 
WHERE payment_method IS NULL;

-- Step 3: Make payment_method NOT NULL after setting defaults
ALTER TABLE payment_transactions 
ALTER COLUMN payment_method SET NOT NULL;

-- Step 4: Add check constraint for valid payment methods
ALTER TABLE payment_transactions 
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'));

-- Step 5: Create index for payment_method for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_method 
ON payment_transactions(payment_method);

-- Step 6: Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
ORDER BY ordinal_position;

-- Step 7: Show sample data
SELECT 
  'Sample payment transactions' as info,
  COUNT(*) as total_transactions
FROM payment_transactions;

-- Success message
SELECT 'Payment transactions table schema fixed successfully!' as status;

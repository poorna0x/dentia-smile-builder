-- =====================================================
-- 💳 CHECK PAYMENT METHODS IN DATABASE
-- =====================================================

-- Check payment_transactions table structure
SELECT 'PAYMENT_TRANSACTIONS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check treatment_payments table structure
SELECT 'TREATMENT_PAYMENTS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'treatment_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample payment transactions
SELECT 'SAMPLE PAYMENT TRANSACTIONS:' as info;
SELECT id, amount, payment_date, notes, treatment_payment_id
FROM payment_transactions 
LIMIT 10;

-- Check sample treatment payments
SELECT 'SAMPLE TREATMENT PAYMENTS:' as info;
SELECT id, treatment_id, clinic_id, total_amount, paid_amount, payment_status
FROM treatment_payments 
LIMIT 10;

-- Check if there's a payment_method column anywhere
SELECT 'LOOKING FOR PAYMENT METHOD COLUMNS:' as info;
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name ILIKE '%payment%' 
OR column_name ILIKE '%method%'
OR column_name ILIKE '%cash%'
OR column_name ILIKE '%upi%'
OR column_name ILIKE '%card%'
ORDER BY table_name, column_name;

-- Check for any payment method data in notes
SELECT 'PAYMENT METHOD IN NOTES:' as info;
SELECT DISTINCT notes
FROM payment_transactions 
WHERE notes IS NOT NULL 
AND notes != ''
LIMIT 20;

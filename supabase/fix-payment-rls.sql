-- =====================================================
-- 🦷 FIX PAYMENT SYSTEM RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON treatment_payments;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON treatment_payments;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON treatment_payments;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payment_transactions;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON payment_transactions;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON payment_transactions;

-- Create new, more permissive policies for treatment_payments
CREATE POLICY "Enable all access for authenticated users" ON treatment_payments
FOR ALL USING (auth.role() = 'authenticated');

-- Create new, more permissive policies for payment_transactions
CREATE POLICY "Enable all access for authenticated users" ON payment_transactions
FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: If you want more specific policies, use these instead:
-- CREATE POLICY "Enable read access for authenticated users" ON treatment_payments
-- FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable insert access for authenticated users" ON treatment_payments
-- FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Enable update access for authenticated users" ON treatment_payments
-- FOR UPDATE USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable delete access for authenticated users" ON treatment_payments
-- FOR DELETE USING (auth.role() = 'authenticated');

-- Same for payment_transactions
-- CREATE POLICY "Enable read access for authenticated users" ON payment_transactions
-- FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable insert access for authenticated users" ON payment_transactions
-- FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Enable update access for authenticated users" ON payment_transactions
-- FOR UPDATE USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable delete access for authenticated users" ON payment_transactions
-- FOR DELETE USING (auth.role() = 'authenticated');

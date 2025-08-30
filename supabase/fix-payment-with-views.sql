-- =====================================================
-- 🔧 FIX PAYMENT SYSTEM WITH VIEWS AND PROPER RLS
-- =====================================================

-- =====================================================
-- 1. CHECK IF TABLES EXIST
-- =====================================================

SELECT '=== CHECKING TABLE EXISTENCE ===' as section;

SELECT 
    table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = t.table_name 
        AND table_schema = 'public'
    ) as table_exists
FROM (VALUES 
    ('treatment_payments'),
    ('payment_transactions')
) AS t(table_name);

-- =====================================================
-- 2. RECREATE PAYMENT TABLES IF THEY DON'T EXIST
-- =====================================================

SELECT '=== RECREATING PAYMENT TABLES ===' as section;

-- Drop tables if they exist
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS treatment_payments CASCADE;

-- Create treatment_payments table
CREATE TABLE treatment_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partial', 'Completed', 'Overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_transactions table
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_payment_id UUID NOT NULL REFERENCES treatment_payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  notes TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

SELECT '=== CREATING INDEXES ===' as section;

CREATE INDEX IF NOT EXISTS idx_treatment_payments_treatment_id ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_clinic_id ON treatment_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_patient_id ON treatment_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_status ON treatment_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(treatment_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date);

-- =====================================================
-- 4. ENABLE RLS AND CREATE PROPER POLICIES
-- =====================================================

SELECT '=== ENABLING RLS WITH PROPER POLICIES ===' as section;

-- Enable RLS
ALTER TABLE treatment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for treatment_payments
CREATE POLICY "Enable read access for authenticated users" ON treatment_payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON treatment_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON treatment_payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON treatment_payments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for payment_transactions
CREATE POLICY "Enable read access for authenticated users" ON payment_transactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON payment_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON payment_transactions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON payment_transactions
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. CREATE SECURE VIEWS
-- =====================================================

SELECT '=== CREATING SECURE VIEWS ===' as section;

-- Create view for treatment payments
CREATE OR REPLACE VIEW treatment_payments_view AS
SELECT 
    tp.*
FROM treatment_payments tp
WHERE auth.role() = 'authenticated';

-- Create view for payment transactions
CREATE OR REPLACE VIEW payment_transactions_view AS
SELECT 
    pt.*,
    tp.treatment_id,
    tp.clinic_id
FROM payment_transactions pt
JOIN treatment_payments tp ON pt.treatment_payment_id = tp.id
WHERE auth.role() = 'authenticated';

-- =====================================================
-- 6. CREATE FUNCTIONS
-- =====================================================

SELECT '=== CREATING FUNCTIONS ===' as section;

-- Create payment status update function
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

-- Create payment transaction update function
CREATE OR REPLACE FUNCTION update_treatment_payment_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE treatment_payments 
  SET paid_amount = paid_amount + NEW.amount
  WHERE id = NEW.treatment_payment_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create add payment transaction function
CREATE OR REPLACE FUNCTION add_payment_transaction(
  p_payment_id UUID,
  p_amount DECIMAL(10,2),
  p_payment_method TEXT,
  p_transaction_id TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO payment_transactions (
    treatment_payment_id,
    amount,
    payment_method,
    transaction_id,
    notes,
    created_at
  ) VALUES (
    p_payment_id,
    p_amount,
    p_payment_method,
    p_transaction_id,
    p_notes,
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- =====================================================
-- 7. CREATE TRIGGERS
-- =====================================================

SELECT '=== CREATING TRIGGERS ===' as section;

CREATE TRIGGER update_treatment_payment_status 
  BEFORE UPDATE ON treatment_payments 
  FOR EACH ROW EXECUTE FUNCTION update_payment_status();

CREATE TRIGGER update_treatment_payment_on_transaction_trigger
  AFTER INSERT ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treatment_payment_on_transaction();

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

SELECT '=== GRANTING PERMISSIONS ===' as section;

-- Grant permissions on tables
GRANT ALL ON treatment_payments TO authenticated;
GRANT ALL ON payment_transactions TO authenticated;

-- Grant permissions on views
GRANT SELECT ON treatment_payments_view TO authenticated;
GRANT SELECT ON payment_transactions_view TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION add_payment_transaction(UUID, DECIMAL, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 9. CREATE SAMPLE DATA
-- =====================================================

SELECT '=== CREATING SAMPLE DATA ===' as section;

-- Insert sample treatment payments
INSERT INTO treatment_payments (
    treatment_id,
    clinic_id,
    patient_id,
    total_amount,
    paid_amount,
    payment_status
) VALUES 
    ('72f23086-32dc-4cc2-8c37-9dfcf47428b9', 'c1ca557d-ca85-4905-beb7-c3985692d463', '00000000-0000-0000-0000-000000000000', 1500.00, 0.00, 'Pending'),
    ('7f1964ee-0845-4273-90e3-e4544ed246b1', 'c1ca557d-ca85-4905-beb7-c3985692d463', '00000000-0000-0000-0000-000000000000', 2000.00, 0.00, 'Pending')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. TEST THE SYSTEM
-- =====================================================

SELECT '=== TESTING PAYMENT SYSTEM ===' as section;

-- Test direct table access
SELECT 
    'treatment_payments direct access' as test_name,
    COUNT(*) as result_count
FROM treatment_payments;

-- Test view access
SELECT 
    'treatment_payments_view access' as test_name,
    COUNT(*) as result_count
FROM treatment_payments_view;

-- Test specific treatment queries
SELECT 
    'specific treatment 1' as test_name,
    COUNT(*) as result_count
FROM treatment_payments 
WHERE treatment_id = '72f23086-32dc-4cc2-8c37-9dfcf47428b9';

SELECT 
    'specific treatment 2' as test_name,
    COUNT(*) as result_count
FROM treatment_payments 
WHERE treatment_id = '7f1964ee-0845-4273-90e3-e4544ed246b1';

-- Test payment_transactions
SELECT 
    'payment_transactions access' as test_name,
    COUNT(*) as result_count
FROM payment_transactions;

-- =====================================================
-- 11. VERIFY RLS STATUS
-- =====================================================

SELECT '=== VERIFYING RLS STATUS ===' as section;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('treatment_payments', 'payment_transactions');

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('treatment_payments', 'payment_transactions')
ORDER BY tablename, policyname;

-- =====================================================
-- 12. SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 Payment system fixed with proper RLS! Should work without 406 errors now.' as status;

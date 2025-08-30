-- =====================================================
-- 🔍 SIMPLE TABLE STRUCTURE CHECK
-- =====================================================

-- Check all table names first
SELECT 'ALL TABLES:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check dental_treatments structure
SELECT 'DENTAL_TREATMENTS COLUMNS:' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dental_treatments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check appointments structure
SELECT 'APPOINTMENTS COLUMNS:' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check treatment_payments structure
SELECT 'TREATMENT_PAYMENTS COLUMNS:' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'treatment_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check payment_transactions structure
SELECT 'PAYMENT_TRANSACTIONS COLUMNS:' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check dentists structure
SELECT 'DENTISTS COLUMNS:' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dentists' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check clinics structure
SELECT 'CLINICS COLUMNS:' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check doctor_attributions structure
SELECT 'DOCTOR_ATTRIBUTIONS COLUMNS:' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'doctor_attributions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

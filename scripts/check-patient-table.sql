-- Check Patient Table Structure
-- Run this in Supabase SQL Editor to see the current table structure

-- Check if patients table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any existing patients
SELECT COUNT(*) as patient_count FROM patients;

-- Check sample patient data (if any)
SELECT * FROM patients LIMIT 3;

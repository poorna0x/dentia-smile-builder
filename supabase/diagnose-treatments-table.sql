-- 🔍 Diagnostic Script for Dental Treatments Table
-- =====================================================
-- 
-- This script checks the actual structure of the dental_treatments table
-- to identify column name mismatches
-- =====================================================

-- Check if the table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'dental_treatments';

-- Get the actual column structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'dental_treatments'
ORDER BY ordinal_position;

-- Check if the view exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'treatments_with_dentist';

-- Check if dentists table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'dentists';

-- Check if patients table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'patients';

-- Check dentists table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'dentists'
ORDER BY ordinal_position;

-- Check patients table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients'
ORDER BY ordinal_position;

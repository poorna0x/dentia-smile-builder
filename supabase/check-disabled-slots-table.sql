-- Check if disabled_slots table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'disabled_slots';

-- Check if the table has the correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'disabled_slots'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'disabled_slots';

-- Check if policies exist
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'disabled_slots';

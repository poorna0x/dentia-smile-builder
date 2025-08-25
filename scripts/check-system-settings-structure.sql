-- Check the structure of system_settings table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'system_settings' 
ORDER BY ordinal_position;

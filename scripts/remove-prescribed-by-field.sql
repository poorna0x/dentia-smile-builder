-- Remove or make prescribed_by field nullable
-- Run this in Supabase SQL Editor

-- Option 1: Make prescribed_by nullable (safer approach)
ALTER TABLE prescriptions ALTER COLUMN prescribed_by DROP NOT NULL;

-- Option 2: Remove the column entirely (if you want to completely remove it)
-- ALTER TABLE prescriptions DROP COLUMN prescribed_by;

-- Update existing records to set prescribed_by to NULL
UPDATE prescriptions SET prescribed_by = NULL WHERE prescribed_by IS NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'prescriptions' 
AND column_name = 'prescribed_by';

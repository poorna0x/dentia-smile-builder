-- Add reminder_sent column to appointments table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'reminder_sent'
    ) THEN
        ALTER TABLE appointments ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update existing appointments to have reminder_sent = false
UPDATE appointments 
SET reminder_sent = FALSE 
WHERE reminder_sent IS NULL;

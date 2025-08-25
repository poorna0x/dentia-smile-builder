-- Add reminder_sent column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent 
ON appointments(reminder_sent, date, status);

-- Update existing appointments to have reminder_sent = false
UPDATE appointments 
SET reminder_sent = FALSE 
WHERE reminder_sent IS NULL;

-- Migration: Add disabled_slots table for temporary slot disabling
-- This allows clinics to disable specific time slots on random days

-- Step 1: Create the disabled_slots table
CREATE TABLE IF NOT EXISTS disabled_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, date, start_time, end_time)
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disabled_slots_clinic_date ON disabled_slots(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_disabled_slots_date ON disabled_slots(date);

-- Step 3: Create trigger for updated_at
CREATE TRIGGER update_disabled_slots_updated_at 
  BEFORE UPDATE ON disabled_slots 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Enable Row Level Security
ALTER TABLE disabled_slots ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy for disabled_slots
CREATE POLICY "Allow all operations on disabled_slots" ON disabled_slots
  FOR ALL USING (true);

-- Step 6: Also enable RLS for clinics table if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clinics' 
        AND policyname = 'Allow all operations on clinics'
    ) THEN
        ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations on clinics" ON clinics
          FOR ALL USING (true);
        RAISE NOTICE 'Enabled RLS for clinics table';
    ELSE
        RAISE NOTICE 'RLS already enabled for clinics table';
    END IF;
END $$;

-- Step 7: Add comment to document the table
COMMENT ON TABLE disabled_slots IS 'Stores temporarily disabled time slots for clinics (e.g., personal appointments, meetings)';
COMMENT ON COLUMN disabled_slots.date IS 'The date when the slot is disabled';
COMMENT ON COLUMN disabled_slots.start_time IS 'Start time of the disabled slot';
COMMENT ON COLUMN disabled_slots.end_time IS 'End time of the disabled slot';
COMMENT ON COLUMN disabled_slots.reason IS 'Optional reason for disabling the slot';

-- Step 8: Verify the setup
SELECT 
  'disabled_slots' as table_name,
  COUNT(*) as total_records
FROM disabled_slots;

-- Step 9: Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'disabled_slots'
ORDER BY ordinal_position;

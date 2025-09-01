-- Add staff_permissions table for role-based access control
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_staff_permissions_updated_at ON staff_permissions;

-- Create staff_permissions table
CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  can_access_settings BOOLEAN DEFAULT FALSE,
  can_access_patient_portal BOOLEAN DEFAULT FALSE,
  can_access_payment_analytics BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id)
);

-- Create trigger for staff_permissions (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_staff_permissions_updated_at') THEN
    CREATE TRIGGER update_staff_permissions_updated_at 
      BEFORE UPDATE ON staff_permissions 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS for staff_permissions
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on staff_permissions" ON staff_permissions;

-- Create policy for staff_permissions
CREATE POLICY "Allow all operations on staff_permissions" ON staff_permissions
  FOR ALL USING (true);

-- Insert default staff permissions for Jeshna Dental (only if not exists)
INSERT INTO staff_permissions (clinic_id, can_access_settings, can_access_patient_portal, can_access_payment_analytics) 
SELECT 
  c.id,
  false,  -- Staff cannot access settings by default
  true,   -- Staff can access patient portal by default
  false   -- Staff cannot access payment analytics by default
FROM clinics c 
WHERE c.slug = 'jeshna-dental'
  AND NOT EXISTS (SELECT 1 FROM staff_permissions WHERE clinic_id = c.id);

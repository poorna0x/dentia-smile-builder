-- =====================================================
-- 🦷 STAFF PERMISSIONS - DATABASE SCHEMA
-- =====================================================
-- 
-- Simple table to store staff permissions per clinic
-- Only 2 permissions: settings access and patient portal access
-- 
-- =====================================================

-- Create staff permissions table
CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  can_access_settings BOOLEAN DEFAULT FALSE,
  can_access_patient_portal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id)
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    -- Add can_access_settings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'staff_permissions' AND column_name = 'can_access_settings') THEN
        ALTER TABLE staff_permissions ADD COLUMN can_access_settings BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add can_access_patient_portal column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'staff_permissions' AND column_name = 'can_access_patient_portal') THEN
        ALTER TABLE staff_permissions ADD COLUMN can_access_patient_portal BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_staff_permissions_clinic_id ON staff_permissions(clinic_id);

-- Create trigger for updated_at (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_staff_permissions_updated_at ON staff_permissions;
CREATE TRIGGER update_staff_permissions_updated_at 
    BEFORE UPDATE ON staff_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read/write staff permissions
-- This is simpler and avoids infinite recursion with user_roles table
DROP POLICY IF EXISTS "Authenticated users can manage staff permissions" ON staff_permissions;
CREATE POLICY "Authenticated users can manage staff permissions" ON staff_permissions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert default permissions for existing clinics
INSERT INTO staff_permissions (clinic_id, can_access_settings, can_access_patient_portal)
SELECT id, FALSE, FALSE
FROM clinics
WHERE id NOT IN (SELECT clinic_id FROM staff_permissions);

COMMENT ON TABLE staff_permissions IS 'Stores clinic-specific staff permissions controlled by admin';

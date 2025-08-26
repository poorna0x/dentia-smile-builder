-- =====================================================
-- 🦷 MULTI-DENTIST SUPPORT - DATABASE SCHEMA
-- =====================================================
-- 
-- PURPOSE: Add multi-dentist support to existing clinic system
-- USAGE: Run this in Supabase SQL Editor
-- COMPATIBILITY: Works with existing single-dentist clinics
-- =====================================================

-- Step 1: Create dentists table
CREATE TABLE IF NOT EXISTS dentists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, name) -- Prevent duplicate names within same clinic
);

-- Step 2: Add dentist_id to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS dentist_id UUID REFERENCES dentists(id) ON DELETE SET NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dentists_clinic_id ON dentists(clinic_id);
CREATE INDEX IF NOT EXISTS idx_dentists_active ON dentists(is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_id ON appointments(dentist_id);

-- Step 4: Create trigger for dentists updated_at
CREATE TRIGGER update_dentists_updated_at 
  BEFORE UPDATE ON dentists 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable RLS for dentists table
ALTER TABLE dentists ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies for dentists table
CREATE POLICY "Allow all operations on dentists" ON dentists
  FOR ALL USING (true);

-- Step 7: Insert default dentist for existing clinics
INSERT INTO dentists (clinic_id, name, specialization, is_active)
SELECT 
  c.id,
  'Dr. ' || c.name || ' (Primary)',
  'General Dentistry',
  true
FROM clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM dentists d WHERE d.clinic_id = c.id
);

-- Step 8: Update existing appointments to use default dentist
UPDATE appointments 
SET dentist_id = (
  SELECT d.id 
  FROM dentists d 
  WHERE d.clinic_id = appointments.clinic_id 
  AND d.is_active = true 
  LIMIT 1
)
WHERE dentist_id IS NULL;

-- Step 9: Create function to get clinic dentists
CREATE OR REPLACE FUNCTION get_clinic_dentists(clinic_uuid UUID)
RETURNS TABLE(
  id UUID,
  name VARCHAR(255),
  specialization VARCHAR(255),
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.specialization,
    d.is_active
  FROM dentists d
  WHERE d.clinic_id = clinic_uuid
  AND d.is_active = true
  ORDER BY d.name;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create function to get dentist performance
CREATE OR REPLACE FUNCTION get_dentist_performance(
  clinic_uuid UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  dentist_id UUID,
  dentist_name VARCHAR(255),
  total_appointments BIGINT,
  completed_appointments BIGINT,
  cancelled_appointments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as dentist_id,
    d.name as dentist_name,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN a.status = 'Cancelled' THEN 1 END) as cancelled_appointments
  FROM dentists d
  LEFT JOIN appointments a ON d.id = a.dentist_id
  WHERE d.clinic_id = clinic_uuid
  AND d.is_active = true
  AND (
    start_date IS NULL OR a.date >= start_date
  )
  AND (
    end_date IS NULL OR a.date <= end_date
  )
  GROUP BY d.id, d.name
  ORDER BY completed_appointments DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ✅ MULTI-DENTIST SCHEMA COMPLETE!
-- =====================================================
-- 
-- WHAT WAS CREATED:
-- ✅ dentists table with clinic_id relationship
-- ✅ dentist_id column added to appointments
-- ✅ Performance indexes for fast queries
-- ✅ RLS policies for security
-- ✅ Default dentist for existing clinics
-- ✅ Helper functions for dentist management
-- 
-- NEXT STEPS:
-- 1. Test the schema in Supabase
-- 2. Build super admin dentist management UI
-- 3. Enhance complete button with dentist selection
-- 4. Add analytics to admin settings
-- =====================================================

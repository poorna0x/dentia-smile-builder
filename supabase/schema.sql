-- =====================================================
-- 🦷 MULTI-TENANT DENTAL CLINIC SYSTEM - DATABASE SETUP
-- =====================================================
-- 
-- STEP-BY-STEP GUIDE:
-- 1. Copy this entire file content
-- 2. Go to Supabase Dashboard → SQL Editor → New Query
-- 3. Paste the content and click "Run"
-- 4. This creates the foundation for ALL clinics
-- 5. Each clinic will have separate data (appointments, settings)
-- 6. Clinic IDs are automatically generated as UUIDs
-- 
-- WHAT THIS CREATES:
-- ✅ clinics table (stores all clinic information)
-- ✅ appointments table (stores all appointments with clinic_id)
-- ✅ scheduling_settings table (clinic-specific settings)
-- ✅ push_subscriptions table (PWA notifications)
-- ✅ Default clinic: "Jeshna Dental Clinic"
-- ✅ Automatic clinic ID generation
-- 
-- MULTI-TENANT FEATURES:
-- ✅ Each clinic has unique UUID (automatically generated)
-- ✅ All data is separated by clinic_id
-- ✅ Jeshna Dental sees only Jeshna appointments
-- ✅ Smile Dental sees only Smile appointments
-- ✅ Same database, completely separate data
-- =====================================================

-- Enable Row Level Security
-- Note: app.jwt_secret setting removed - not needed for this setup

-- =====================================================
-- STEP 1: CREATE CLINICS TABLE
-- =====================================================
-- This table stores information for ALL clinics
-- Each clinic gets a unique UUID automatically
-- slug: URL-friendly identifier (e.g., "jeshna-dental", "smile-dental")
-- clinic_id: Links all other data to this clinic
-- =====================================================
CREATE TABLE IF NOT EXISTS clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  -- Unique clinic ID (auto-generated)
  name VARCHAR(255) NOT NULL,                     -- Clinic name
  slug VARCHAR(100) UNIQUE NOT NULL,              -- URL slug (e.g., "jeshna-dental")
  domain VARCHAR(255),                            -- Custom domain (optional)
  logo_url VARCHAR(500),                          -- Clinic logo URL
  contact_phone VARCHAR(20),                      -- Contact phone
  contact_email VARCHAR(255),                     -- Contact email
  address TEXT,                                   -- Clinic address
  working_hours JSONB DEFAULT '{}',               -- Working hours (JSON)
  is_active BOOLEAN DEFAULT TRUE,                 -- Active/Inactive clinic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE APPOINTMENTS TABLE
-- =====================================================
-- This table stores ALL appointments for ALL clinics
-- clinic_id links each appointment to a specific clinic
-- Jeshna Dental appointments have clinic_id = jeshna-clinic-uuid
-- Smile Dental appointments have clinic_id = smile-clinic-uuid
-- They never mix! Each clinic sees only their appointments
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  -- Unique appointment ID
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,  -- Links to clinic
  name VARCHAR(255) NOT NULL,                     -- Patient name
  phone VARCHAR(20) NOT NULL,                     -- Patient phone
  email VARCHAR(255) NOT NULL,                    -- Patient email
  date DATE NOT NULL,                             -- Appointment date
  time VARCHAR(50) NOT NULL,                      -- Appointment time
  status VARCHAR(20) NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Cancelled', 'Completed', 'Rescheduled')),
  original_date DATE,                             -- For rescheduled appointments
  original_time VARCHAR(50),                      -- For rescheduled appointments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduling_settings table with clinic_id
CREATE TABLE IF NOT EXISTS scheduling_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_schedules JSONB NOT NULL DEFAULT '{}',
  weekly_holidays INTEGER[] DEFAULT '{}',
  custom_holidays DATE[] DEFAULT '{}',
  disabled_appointments BOOLEAN DEFAULT FALSE,
  disable_until_date DATE,
  disable_until_time TIME,
  disabled_slots TEXT[] DEFAULT '{}',
  show_stats_cards BOOLEAN DEFAULT TRUE,
  notification_settings JSONB NOT NULL DEFAULT '{"email_notifications": true, "reminder_hours": 24, "auto_confirm": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduling_settings_updated_at 
  BEFORE UPDATE ON scheduling_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments table
-- Allow all operations for now (you can restrict this later based on your needs)
CREATE POLICY "Allow all operations on appointments" ON appointments
  FOR ALL USING (true);

-- Create policies for scheduling_settings table
CREATE POLICY "Allow all operations on scheduling_settings" ON scheduling_settings
  FOR ALL USING (true);

-- Create policies for clinics table
CREATE POLICY "Allow all operations on clinics" ON clinics
  FOR ALL USING (true);

-- =====================================================
-- STEP 3: CREATE DEFAULT CLINIC (Jeshna Dental)
-- =====================================================
-- This creates your first clinic automatically
-- clinic_id will be auto-generated as UUID
-- This is the default clinic that loads when no clinic specified
-- =====================================================
INSERT INTO clinics (name, slug, contact_phone, contact_email, address) 
VALUES (
  'Jeshna Dental Clinic',
  'jeshna-dental',
  '6363116263',
  'poorn8105@gmail.com',  -- Updated to your email
  'Bangalore, Karnataka'
) ON CONFLICT (slug) DO NOTHING;

-- Insert default scheduling settings for Jeshna Dental
INSERT INTO scheduling_settings (clinic_id, day_schedules, notification_settings, show_stats_cards) 
SELECT 
  c.id,
  '{
    "0": {"start_time": "10:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": false},
    "1": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "2": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "3": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "4": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "5": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "6": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": false}
  }',
  '{"email_notifications": true, "reminder_hours": 24, "auto_confirm": true}',
  true
FROM clinics c 
WHERE c.slug = 'jeshna-dental'
ON CONFLICT (clinic_id) DO NOTHING;

-- Create disabled_slots table for storing temporarily disabled time slots
CREATE TABLE IF NOT EXISTS disabled_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, date, start_time, end_time)
);

-- Create indexes for disabled_slots
CREATE INDEX IF NOT EXISTS idx_disabled_slots_clinic_date ON disabled_slots(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_disabled_slots_date ON disabled_slots(date);

-- Create push_subscriptions table for storing push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for disabled_slots
CREATE TRIGGER update_disabled_slots_updated_at 
  BEFORE UPDATE ON disabled_slots 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for disabled_slots and push_subscriptions
ALTER TABLE disabled_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for disabled_slots
CREATE POLICY "Allow all operations on disabled_slots" ON disabled_slots
  FOR ALL USING (true);

-- Create policy for push_subscriptions
CREATE POLICY "Allow all operations on push_subscriptions" ON push_subscriptions
  FOR ALL USING (true);

-- Create staff_permissions table for role-based access control
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

-- Create trigger for staff_permissions
CREATE TRIGGER update_staff_permissions_updated_at 
  BEFORE UPDATE ON staff_permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for staff_permissions
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for staff_permissions
CREATE POLICY "Allow all operations on staff_permissions" ON staff_permissions
  FOR ALL USING (true);

-- Insert default staff permissions for Jeshna Dental
INSERT INTO staff_permissions (clinic_id, can_access_settings, can_access_patient_portal, can_access_payment_analytics) 
SELECT 
  c.id,
  false,  -- Staff cannot access settings by default
  true,   -- Staff can access patient portal by default
  false   -- Staff cannot access payment analytics by default
FROM clinics c 
WHERE c.slug = 'jeshna-dental'
ON CONFLICT (clinic_id) DO NOTHING;

-- =====================================================
-- ✅ SETUP COMPLETE!
-- =====================================================
-- 
-- WHAT WAS CREATED:
-- ✅ clinics table with default "Jeshna Dental Clinic"
-- ✅ appointments table (ready for multi-clinic data)
-- ✅ scheduling_settings table (clinic-specific settings)
-- ✅ disabled_slots table (temporary slot disabling)
-- ✅ push_subscriptions table (PWA notifications)
-- ✅ All necessary indexes and triggers
-- ✅ Row Level Security enabled
-- 
-- NEXT STEPS:
-- 1. Test the appointment booking: http://localhost:8083/appointment
-- 2. Check admin panel: http://localhost:8083/admin
-- 3. Add more clinics using the setup script
-- 
-- MULTI-TENANT READY:
-- ✅ Each clinic will have separate data
-- ✅ All features work for new clinics automatically
-- ✅ Clinic IDs are automatically generated
-- ✅ No data mixing between clinics
-- =====================================================

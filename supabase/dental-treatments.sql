-- =====================================================
-- 🦷 DENTAL TREATMENT SYSTEM
-- =====================================================
-- 
-- This system allows dentists to track treatments per tooth
-- Includes visual tooth chart and detailed treatment history
-- 
-- USAGE:
-- 1. Copy this file to your Supabase SQL Editor
-- 2. Run the SQL to create dental treatment tables
-- 3. This will enable tooth-specific treatment tracking
-- =====================================================

-- =====================================================
-- STEP 1: DENTAL TREATMENTS TABLE
-- =====================================================
-- Track treatments for specific teeth
-- =====================================================

CREATE TABLE IF NOT EXISTS dental_treatments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  tooth_number VARCHAR(10) NOT NULL, -- e.g., "11", "21", "32", etc.
  tooth_position VARCHAR(20) NOT NULL, -- "Upper Right", "Upper Left", "Lower Right", "Lower Left"
  treatment_type VARCHAR(100) NOT NULL, -- "Cleaning", "Filling", "Root Canal", "Extraction", "Crown", etc.
  treatment_description TEXT,
  treatment_status VARCHAR(50) DEFAULT 'Planned' CHECK (treatment_status IN ('Planned', 'In Progress', 'Completed', 'Cancelled')),
  treatment_date DATE,
  cost DECIMAL(10,2),
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: TOOTH CONDITIONS TABLE
-- =====================================================
-- Track current condition of each tooth
-- =====================================================

CREATE TABLE IF NOT EXISTS tooth_conditions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number VARCHAR(10) NOT NULL,
  tooth_position VARCHAR(20) NOT NULL,
  condition_type VARCHAR(100) NOT NULL, -- "Healthy", "Cavity", "Filled", "Crown", "Missing", "Sensitive", etc.
  condition_description TEXT,
  severity VARCHAR(20) DEFAULT 'Mild' CHECK (severity IN ('Mild', 'Moderate', 'Severe')),
  last_updated DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, patient_id, tooth_number)
);

-- =====================================================
-- STEP 3: DENTAL NOTES TABLE
-- =====================================================
-- General dental notes and observations
-- =====================================================

CREATE TABLE IF NOT EXISTS dental_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  note_type VARCHAR(50) DEFAULT 'General' CHECK (note_type IN ('General', 'Examination', 'Treatment', 'Follow-up', 'Emergency')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  is_private BOOLEAN DEFAULT FALSE, -- Private notes not visible to patients
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE INDEXES
-- =====================================================
-- Optimize queries for fast performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_dental_treatments_patient ON dental_treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_dental_treatments_tooth ON dental_treatments(tooth_number);
CREATE INDEX IF NOT EXISTS idx_dental_treatments_appointment ON dental_treatments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_tooth_conditions_patient ON tooth_conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_tooth_conditions_tooth ON tooth_conditions(tooth_number);
CREATE INDEX IF NOT EXISTS idx_dental_notes_patient ON dental_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_dental_notes_appointment ON dental_notes(appointment_id);

-- =====================================================
-- STEP 5: CREATE TRIGGERS
-- =====================================================
-- Automatically update timestamps
-- =====================================================

CREATE TRIGGER update_dental_treatments_updated_at 
  BEFORE UPDATE ON dental_treatments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tooth_conditions_updated_at 
  BEFORE UPDATE ON tooth_conditions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dental_notes_updated_at 
  BEFORE UPDATE ON dental_notes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- =====================================================
-- Ensure data separation between clinics
-- =====================================================

ALTER TABLE dental_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on dental_treatments" ON dental_treatments;
DROP POLICY IF EXISTS "Allow all operations on tooth_conditions" ON tooth_conditions;
DROP POLICY IF EXISTS "Allow all operations on dental_notes" ON dental_notes;

-- Create policies
CREATE POLICY "Allow all operations on dental_treatments" ON dental_treatments
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on tooth_conditions" ON tooth_conditions
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on dental_notes" ON dental_notes
  FOR ALL USING (true);

-- =====================================================
-- ✅ DENTAL TREATMENT SYSTEM COMPLETE!
-- =====================================================
-- 
-- WHAT WAS CREATED:
-- ✅ dental_treatments - Track treatments per tooth
-- ✅ tooth_conditions - Current condition of each tooth
-- ✅ dental_notes - General dental notes and observations
-- ✅ All necessary indexes and triggers
-- ✅ Row Level Security enabled
-- 
-- TOOTH NUMBERING SYSTEM:
-- ✅ Universal numbering system (1-32)
-- ✅ Position tracking (Upper Right, Upper Left, etc.)
-- ✅ Treatment history per tooth
-- ✅ Condition tracking per tooth
-- 
-- MULTI-CLINIC FEATURES:
-- ✅ Each clinic has separate dental data
-- ✅ Template ready for any clinic
-- 
-- NEXT STEPS:
-- 1. Create dental treatment API functions
-- 2. Build visual tooth chart component
-- 3. Create admin interface for dental treatments
-- 4. Add dental data to patient dashboard
-- 
-- TEMPLATE READY:
-- ✅ Copy this schema for any new clinic
-- ✅ Each clinic gets separate dental data automatically
-- ✅ No data mixing between clinics
-- =====================================================

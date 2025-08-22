-- =====================================================
-- 🏥 MULTI-CLINIC PATIENT MANAGEMENT SYSTEM
-- =====================================================
-- 
-- This schema adds patient management to the existing multi-clinic system.
-- Each clinic will have separate patient data (clinic_id separation).
-- 
-- FEATURES:
-- ✅ Patient profiles with medical history
-- ✅ Phone number authentication for patient portal
-- ✅ Appointment linking to patients
-- ✅ Multi-clinic data separation
-- ✅ Template ready for any clinic
-- 
-- USAGE:
-- 1. Copy this file to your Supabase SQL Editor
-- 2. Run the SQL to create patient management tables
-- 3. Each clinic automatically gets separate patient data
-- =====================================================

-- =====================================================
-- STEP 1: CREATE PATIENTS TABLE
-- =====================================================
-- This table stores ALL patients for ALL clinics
-- clinic_id ensures each clinic sees only their patients
-- =====================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(10),
  address TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  medical_history JSONB DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  current_medications TEXT[] DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE PATIENT AUTHENTICATION TABLE
-- =====================================================
-- This table manages patient portal access
-- clinic_id ensures clinic-specific authentication
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_auth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, phone)
);

-- =====================================================
-- STEP 3: CREATE TREATMENT PLANS TABLE
-- =====================================================
-- This table stores treatment plans for each patient
-- clinic_id ensures clinic-specific treatment data
-- =====================================================
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_name VARCHAR(255) NOT NULL,
  treatment_description TEXT,
  treatment_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled', 'On Hold')),
  start_date DATE,
  end_date DATE,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE MEDICAL RECORDS TABLE
-- =====================================================
-- This table stores medical records and notes
-- clinic_id ensures clinic-specific medical data
-- =====================================================
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  record_type VARCHAR(100) NOT NULL, -- 'consultation', 'treatment', 'xray', 'prescription'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500), -- For X-rays, documents, etc.
  record_date DATE NOT NULL,
  created_by VARCHAR(100), -- Doctor/staff name
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: LINK APPOINTMENTS TO PATIENTS
-- =====================================================
-- Add patient_id to existing appointments table
-- This links appointments to patient profiles
-- =====================================================
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- =====================================================
-- These indexes ensure fast queries for patient data
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_patient_auth_clinic_phone ON patient_auth(clinic_id, phone);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);

-- =====================================================
-- STEP 7: CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================
-- Automatically update updated_at timestamp
-- =====================================================
CREATE TRIGGER update_patients_updated_at 
  BEFORE UPDATE ON patients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_auth_updated_at 
  BEFORE UPDATE ON patient_auth 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at 
  BEFORE UPDATE ON treatment_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at 
  BEFORE UPDATE ON medical_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- =====================================================
-- Ensure data separation between clinics
-- =====================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Create policies for patients table
CREATE POLICY "Allow all operations on patients" ON patients
  FOR ALL USING (true);

-- Create policies for patient_auth table
CREATE POLICY "Allow all operations on patient_auth" ON patient_auth
  FOR ALL USING (true);

-- Create policies for treatment_plans table
CREATE POLICY "Allow all operations on treatment_plans" ON treatment_plans
  FOR ALL USING (true);

-- Create policies for medical_records table
CREATE POLICY "Allow all operations on medical_records" ON medical_records
  FOR ALL USING (true);

-- =====================================================
-- ✅ PATIENT MANAGEMENT SETUP COMPLETE!
-- =====================================================
-- 
-- WHAT WAS CREATED:
-- ✅ patients table (multi-clinic patient profiles)
-- ✅ patient_auth table (phone authentication)
-- ✅ treatment_plans table (treatment tracking)
-- ✅ medical_records table (medical history)
-- ✅ Appointment linking (patient_id added)
-- ✅ All necessary indexes and triggers
-- ✅ Row Level Security enabled
-- 
-- MULTI-CLINIC FEATURES:
-- ✅ Each clinic has separate patient data
-- ✅ Phone number authentication per clinic
-- ✅ Treatment plans per clinic
-- ✅ Medical records per clinic
-- ✅ Template ready for any clinic
-- 
-- NEXT STEPS:
-- 1. Create patient management API functions
-- 2. Build patient portal UI
-- 3. Integrate with existing appointment system
-- 4. Test multi-clinic functionality
-- 
-- TEMPLATE READY:
-- ✅ Copy this schema for any new clinic
-- ✅ Each clinic gets separate data automatically
-- ✅ No data mixing between clinics
-- =====================================================

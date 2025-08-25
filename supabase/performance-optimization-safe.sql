-- 🔧 Performance Optimization - Safe Foreign Key Indexes
-- =====================================================
-- 
-- This script adds missing indexes on foreign key columns to improve query performance
-- We're only adding indexes (safe) and not removing unused indexes (potentially risky)
-- =====================================================

-- Add indexes for foreign key columns to improve JOIN performance

-- Appointments table
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);

-- Dental notes table
CREATE INDEX IF NOT EXISTS idx_dental_notes_clinic_id ON dental_notes(clinic_id);

-- Dental treatments table
CREATE INDEX IF NOT EXISTS idx_dental_treatments_clinic_id ON dental_treatments(clinic_id);

-- Lab work table
CREATE INDEX IF NOT EXISTS idx_lab_work_appointment_id ON lab_work(appointment_id);

-- Medical records table
CREATE INDEX IF NOT EXISTS idx_medical_records_clinic_id ON medical_records(clinic_id);

-- Patient auth table
CREATE INDEX IF NOT EXISTS idx_patient_auth_patient_id ON patient_auth(patient_id);

-- Push subscriptions table
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_clinic_id ON push_subscriptions(clinic_id);

-- Treatment plans table
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinic_id ON treatment_plans(clinic_id);

-- Display completion message
SELECT 'Foreign Key Indexes Added Successfully!' as status;

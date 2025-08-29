-- 🔧 Fix Treatments with Dentist View Security Issue (Corrected)
-- =====================================================
-- 
-- This script fixes the SECURITY DEFINER issue with the treatments_with_dentist view
-- by recreating it with SECURITY INVOKER and handling column name variations
-- =====================================================

-- First, check if the view exists and drop it
DROP VIEW IF EXISTS treatments_with_dentist;

-- Create the view with SECURITY INVOKER (explicit)
-- Using COALESCE to handle different possible column names
CREATE OR REPLACE VIEW treatments_with_dentist 
WITH (security_invoker = true) AS
SELECT 
  dt.id,
  dt.treatment_type,
  dt.tooth_number,
  COALESCE(dt.description, dt.treatment_description) as description,
  dt.cost,
  COALESCE(dt.status, dt.treatment_status) as status,
  COALESCE(dt.treatment_date, dt.date) as treatment_date,
  d.name as dentist_name,
  CONCAT(p.first_name, ' ', p.last_name) as patient_name,
  dt.created_at,
  dt.clinic_id
FROM dental_treatments dt
LEFT JOIN dentists d ON dt.dentist_id = d.id
LEFT JOIN patients p ON dt.patient_id = p.id;

-- Grant access to the view
GRANT SELECT ON treatments_with_dentist TO authenticated;

-- Display completion message
SELECT 'Treatments with Dentist View Security Fix Complete!' as status;

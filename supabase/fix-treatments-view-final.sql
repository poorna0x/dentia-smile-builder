-- 🔧 Final Fix for Treatments with Dentist View Security Issue
-- =====================================================
-- 
-- This script fixes the SECURITY DEFINER issue with the treatments_with_dentist view
-- by recreating it with SECURITY INVOKER and handling common column name variations
-- =====================================================

-- First, check if the view exists and drop it
DROP VIEW IF EXISTS treatments_with_dentist;

-- Create the view with SECURITY INVOKER (explicit)
-- Handle common column name variations in dental_treatments table
CREATE OR REPLACE VIEW treatments_with_dentist 
WITH (security_invoker = true) AS
SELECT 
  dt.id,
  dt.treatment_type,
  dt.tooth_number,
  -- Handle description column variations
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'description') 
    THEN dt.description
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'treatment_description') 
    THEN dt.treatment_description
    ELSE NULL
  END as description,
  dt.cost,
  -- Handle status column variations
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'status') 
    THEN dt.status
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'treatment_status') 
    THEN dt.treatment_status
    ELSE 'planned'
  END as status,
  -- Handle date column variations
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'treatment_date') 
    THEN dt.treatment_date
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'date') 
    THEN dt.date
    ELSE NULL
  END as treatment_date,
  d.name as dentist_name,
  CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as patient_name,
  dt.created_at,
  dt.clinic_id
FROM dental_treatments dt
LEFT JOIN dentists d ON dt.dentist_id = d.id
LEFT JOIN patients p ON dt.patient_id = p.id;

-- Grant access to the view
GRANT SELECT ON treatments_with_dentist TO authenticated;

-- Display completion message
SELECT 'Treatments with Dentist View Security Fix Complete!' as status;

-- 🔧 Simple Fix for Treatments with Dentist View Security Issue
-- =====================================================
-- 
-- This script first checks the actual table structure and then creates
-- the appropriate view with SECURITY INVOKER
-- =====================================================

-- First, check if the view exists and drop it
DROP VIEW IF EXISTS treatments_with_dentist;

-- Check what columns exist in dental_treatments table
DO $$
DECLARE
    has_description BOOLEAN;
    has_treatment_description BOOLEAN;
    has_status BOOLEAN;
    has_treatment_status BOOLEAN;
    has_treatment_date BOOLEAN;
    has_date BOOLEAN;
    has_dentist_id BOOLEAN;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dental_treatments' AND column_name = 'description'
    ) INTO has_description;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dental_treatments' AND column_name = 'treatment_description'
    ) INTO has_treatment_description;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dental_treatments' AND column_name = 'status'
    ) INTO has_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dental_treatments' AND column_name = 'treatment_status'
    ) INTO has_treatment_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dental_treatments' AND column_name = 'treatment_date'
    ) INTO has_treatment_date;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dental_treatments' AND column_name = 'date'
    ) INTO has_date;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dental_treatments' AND column_name = 'dentist_id'
    ) INTO has_dentist_id;
    
    -- Create the view based on what columns exist
    EXECUTE format('
        CREATE OR REPLACE VIEW treatments_with_dentist 
        WITH (security_invoker = true) AS
        SELECT 
          dt.id,
          dt.treatment_type,
          dt.tooth_number,
          %s as description,
          dt.cost,
          %s as status,
          %s as treatment_date,
          %s as dentist_name,
          CONCAT(p.first_name, '' '', COALESCE(p.last_name, '''')) as patient_name,
          dt.created_at,
          dt.clinic_id
        FROM dental_treatments dt
        %s
        LEFT JOIN patients p ON dt.patient_id = p.id
    ',
    -- Description column
    CASE 
        WHEN has_description THEN 'dt.description'
        WHEN has_treatment_description THEN 'dt.treatment_description'
        ELSE 'NULL'
    END,
    -- Status column
    CASE 
        WHEN has_status THEN 'dt.status'
        WHEN has_treatment_status THEN 'dt.treatment_status'
        ELSE '''planned'''
    END,
    -- Date column
    CASE 
        WHEN has_treatment_date THEN 'dt.treatment_date'
        WHEN has_date THEN 'dt.date'
        ELSE 'NULL'
    END,
    -- Dentist name
    CASE 
        WHEN has_dentist_id THEN 'd.name'
        ELSE 'NULL'
    END,
    -- Dentist join
    CASE 
        WHEN has_dentist_id THEN 'LEFT JOIN dentists d ON dt.dentist_id = d.id'
        ELSE ''
    END
    );
    
    RAISE NOTICE 'View created successfully with available columns';
END $$;

-- Grant access to the view
GRANT SELECT ON treatments_with_dentist TO authenticated;

-- Display completion message
SELECT 'Treatments with Dentist View Security Fix Complete!' as status;

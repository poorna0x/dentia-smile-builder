-- =====================================================
-- 🔧 FIX GET_PATIENT_BY_PHONE DATA TYPE MISMATCH
-- =====================================================
-- 
-- This fixes the data type mismatch error:
-- "Returned type character varying(100) does not match expected type text"
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS get_patient_by_phone(VARCHAR(20), UUID);
DROP FUNCTION IF EXISTS get_patient_by_phone(TEXT, UUID);
DROP FUNCTION IF EXISTS get_patient_by_phone(VARCHAR, UUID);

-- Create the function with TEXT parameter to match the call
CREATE OR REPLACE FUNCTION get_patient_by_phone(p_phone TEXT, p_clinic_id UUID)
RETURNS TABLE(
    patient_id UUID,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT,
    phone_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as patient_id,
        p.first_name::TEXT,
        p.last_name::TEXT,
        (p.first_name || ' ' || COALESCE(p.last_name, ''))::TEXT as full_name,
        p.email::TEXT,
        COUNT(pp.phone) as phone_count
    FROM patients p
    LEFT JOIN patient_phones pp ON p.id = pp.patient_id
    WHERE p.clinic_id = p_clinic_id
    AND EXISTS (
        SELECT 1 FROM patient_phones pp2 
        WHERE pp2.patient_id = p.id 
        AND pp2.phone = p_phone
    )
    GROUP BY p.id, p.first_name, p.last_name, p.email;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ✅ TEST THE FUNCTION
-- =====================================================
-- 
-- After running this fix, test with:
-- SELECT * FROM get_patient_by_phone('6361631253', 'c1ca557d-ca85-4905-beb7-c3985692d463');
-- 
-- =====================================================

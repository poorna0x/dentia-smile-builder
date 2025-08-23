-- =====================================================
-- 🔧 FIX GET_PATIENT_BY_PHONE FUNCTION
-- =====================================================
-- 
-- This fixes the data type mismatch error
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop and recreate the function with correct data types
DROP FUNCTION IF EXISTS get_patient_by_phone(VARCHAR(20), UUID);

CREATE OR REPLACE FUNCTION get_patient_by_phone(p_phone VARCHAR(20), p_clinic_id UUID)
RETURNS TABLE(
    patient_id UUID,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as patient_id,
        p.first_name,
        p.last_name,
        (p.first_name || ' ' || COALESCE(p.last_name, ''))::VARCHAR(255) as full_name,
        p.email,
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
-- SELECT * FROM get_patient_by_phone('8105876772', 'c1ca557d-ca85-4905-beb7-c3985692d463');
-- 
-- =====================================================

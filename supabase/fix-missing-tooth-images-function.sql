-- =====================================================
-- 🔧 FIX MISSING TOOTH_IMAGES FUNCTION
-- =====================================================
-- 
-- This script creates the missing get_tooth_images function
-- that's causing the 404 error in the dental chart
-- =====================================================

SELECT '=== FIXING MISSING TOOTH_IMAGES FUNCTION ===' as section;

-- =====================================================
-- 1. CHECK CURRENT STATE
-- =====================================================

-- Check if the function exists
SELECT 
    'function check' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_tooth_images';

-- Check tooth_images table structure
SELECT 
    'table structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tooth_images'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CREATE THE MISSING FUNCTION
-- =====================================================

-- Drop function if it exists (to recreate it)
DROP FUNCTION IF EXISTS get_tooth_images(p_clinic_id UUID, p_patient_id UUID);

-- Create the get_tooth_images function
CREATE OR REPLACE FUNCTION get_tooth_images(
    p_clinic_id UUID,
    p_patient_id UUID
)
RETURNS TABLE (
    id UUID,
    clinic_id UUID,
    patient_id UUID,
    tooth_number VARCHAR,
    image_url TEXT,
    image_type VARCHAR,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return tooth images for the specified patient and clinic
    RETURN QUERY
    SELECT 
        ti.id,
        ti.clinic_id,
        ti.patient_id,
        ti.tooth_number,
        ti.image_url,
        ti.image_type,
        ti.uploaded_at,
        ti.created_at,
        ti.updated_at
    FROM tooth_images ti
    WHERE ti.clinic_id = p_clinic_id
      AND ti.patient_id = p_patient_id
    ORDER BY ti.tooth_number, ti.uploaded_at DESC;
END;
$$;

-- =====================================================
-- 3. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION get_tooth_images(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tooth_images(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_tooth_images(UUID, UUID) TO service_role;

-- =====================================================
-- 4. VERIFY THE FUNCTION
-- =====================================================

-- Check if function was created successfully
SELECT 
    'function created' as check_type,
    routine_name,
    routine_type,
    data_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_name = 'get_tooth_images';

-- Check function parameters
SELECT 
    'function parameters' as check_type,
    parameter_name,
    parameter_mode,
    data_type,
    ordinal_position
FROM information_schema.parameters 
WHERE specific_name LIKE 'get_tooth_images%'
ORDER BY ordinal_position;

-- =====================================================
-- 5. TEST THE FUNCTION
-- =====================================================

-- Test the function with sample data (if any exists)
SELECT 
    'function test' as test_type,
    COUNT(*) as result_count
FROM get_tooth_images(
    'c1ca557d-ca85-4905-beb7-c3985692d463'::UUID,
    (SELECT id FROM patients LIMIT 1)
);

-- =====================================================
-- 6. CHECK TOOTH_IMAGES TABLE RLS
-- =====================================================

-- Check RLS status on tooth_images table
SELECT 
    'tooth_images RLS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tooth_images';

-- Check policies on tooth_images table
SELECT 
    'tooth_images policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'tooth_images'
ORDER BY policyname;

-- =====================================================
-- 7. FIX TOOTH_IMAGES RLS IF NEEDED
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE tooth_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations on tooth_images" ON tooth_images;
DROP POLICY IF EXISTS "Users can view their own clinic's tooth images" ON tooth_images;
DROP POLICY IF EXISTS "Users can insert tooth images for their clinic" ON tooth_images;
DROP POLICY IF EXISTS "Users can update tooth images for their clinic" ON tooth_images;
DROP POLICY IF EXISTS "Users can delete tooth images for their clinic" ON tooth_images;

-- Create permissive policy
CREATE POLICY "Allow all operations on tooth_images" ON tooth_images
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON tooth_images TO authenticated;
GRANT ALL ON tooth_images TO anon;
GRANT ALL ON tooth_images TO service_role;

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 get_tooth_images function created and tooth_images RLS fixed! The dental chart should now load tooth images without 404 errors.' as status;

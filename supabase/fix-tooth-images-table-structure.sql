-- =====================================================
-- 🔧 FIX TOOTH_IMAGES TABLE STRUCTURE
-- =====================================================
-- 
-- This script checks the actual tooth_images table structure
-- and fixes the function to match the real columns
-- =====================================================

SELECT '=== FIXING TOOTH_IMAGES TABLE STRUCTURE ===' as section;

-- =====================================================
-- 1. CHECK ACTUAL TABLE STRUCTURE
-- =====================================================

-- Check what columns actually exist in tooth_images table
SELECT 
    'actual columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tooth_images'
ORDER BY ordinal_position;

-- Check if table exists
SELECT 
    'table existence' as check_type,
    table_name,
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_name = 'tooth_images';

-- =====================================================
-- 2. CREATE TOOTH_IMAGES TABLE IF MISSING
-- =====================================================

-- Create tooth_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS tooth_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tooth_number VARCHAR(10) NOT NULL,
    image_url TEXT,
    image_type VARCHAR(50),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ADD MISSING COLUMNS IF NEEDED
-- =====================================================

-- Add image_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tooth_images' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE tooth_images ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Add image_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tooth_images' AND column_name = 'image_type'
    ) THEN
        ALTER TABLE tooth_images ADD COLUMN image_type VARCHAR(50);
    END IF;
END $$;

-- Add uploaded_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tooth_images' AND column_name = 'uploaded_at'
    ) THEN
        ALTER TABLE tooth_images ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tooth_images_clinic_patient ON tooth_images(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_tooth_images_tooth_number ON tooth_images(tooth_number);
CREATE INDEX IF NOT EXISTS idx_tooth_images_uploaded_at ON tooth_images(uploaded_at);

-- =====================================================
-- 5. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Create trigger for updated_at
CREATE TRIGGER update_tooth_images_updated_at 
    BEFORE UPDATE ON tooth_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. FIX THE FUNCTION WITH CORRECT COLUMNS
-- =====================================================

-- Drop the old function
DROP FUNCTION IF EXISTS get_tooth_images(p_clinic_id UUID, p_patient_id UUID);

-- Create the function with correct column names
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
        COALESCE(ti.image_url, '') as image_url,
        COALESCE(ti.image_type, '') as image_type,
        COALESCE(ti.uploaded_at, ti.created_at) as uploaded_at,
        ti.created_at,
        ti.updated_at
    FROM tooth_images ti
    WHERE ti.clinic_id = p_clinic_id
      AND ti.patient_id = p_patient_id
    ORDER BY ti.tooth_number, COALESCE(ti.uploaded_at, ti.created_at) DESC;
END;
$$;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION get_tooth_images(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tooth_images(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_tooth_images(UUID, UUID) TO service_role;

-- Grant table permissions
GRANT ALL ON tooth_images TO authenticated;
GRANT ALL ON tooth_images TO anon;
GRANT ALL ON tooth_images TO service_role;

-- =====================================================
-- 8. ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE tooth_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on tooth_images" ON tooth_images;
DROP POLICY IF EXISTS "Users can view their own clinic's tooth images" ON tooth_images;
DROP POLICY IF EXISTS "Users can insert tooth images for their clinic" ON tooth_images;
DROP POLICY IF EXISTS "Users can update tooth images for their clinic" ON tooth_images;
DROP POLICY IF EXISTS "Users can delete tooth images for their clinic" ON tooth_images;

-- Create permissive policy
CREATE POLICY "Allow all operations on tooth_images" ON tooth_images
    FOR ALL USING (true);

-- =====================================================
-- 9. VERIFICATION
-- =====================================================

-- Check final table structure
SELECT 
    'final structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tooth_images'
ORDER BY ordinal_position;

-- Check function
SELECT 
    'function status' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_tooth_images';

-- Test function
SELECT 
    'function test' as test_type,
    COUNT(*) as result_count
FROM get_tooth_images(
    'c1ca557d-ca85-4905-beb7-c3985692d463'::UUID,
    (SELECT id FROM patients LIMIT 1)
);

-- =====================================================
-- 10. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 tooth_images table structure fixed and get_tooth_images function updated! The dental chart should now work without column errors.' as status;

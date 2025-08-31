-- =====================================================
-- 🔧 FIX TOOTH_IMAGES COLUMN MISMATCH
-- =====================================================
-- 
-- This script fixes the mismatch between database columns
-- and frontend interface for tooth images
-- =====================================================

SELECT '=== FIXING TOOTH_IMAGES COLUMN MISMATCH ===' as section;

-- =====================================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- =====================================================

-- Check what columns actually exist
SELECT 
    'current columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tooth_images'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK SAMPLE DATA
-- =====================================================

-- Show sample data to see what's actually stored
SELECT 
    'sample data' as data_type,
    id,
    clinic_id,
    patient_id,
    tooth_number,
    image_url,
    image_type,
    uploaded_at,
    created_at
FROM tooth_images 
LIMIT 3;

-- =====================================================
-- 3. ADD MISSING COLUMNS FOR FRONTEND COMPATIBILITY
-- =====================================================

-- Add cloudinary_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tooth_images' AND column_name = 'cloudinary_url'
    ) THEN
        ALTER TABLE tooth_images ADD COLUMN cloudinary_url TEXT;
    END IF;
END $$;

-- Add cloudinary_public_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tooth_images' AND column_name = 'cloudinary_public_id'
    ) THEN
        ALTER TABLE tooth_images ADD COLUMN cloudinary_public_id TEXT;
    END IF;
END $$;

-- Add file_size_bytes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tooth_images' AND column_name = 'file_size_bytes'
    ) THEN
        ALTER TABLE tooth_images ADD COLUMN file_size_bytes BIGINT;
    END IF;
END $$;

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tooth_images' AND column_name = 'description'
    ) THEN
        ALTER TABLE tooth_images ADD COLUMN description TEXT;
    END IF;
END $$;

-- =====================================================
-- 4. MIGRATE EXISTING DATA
-- =====================================================

-- Copy image_url to cloudinary_url for existing records
UPDATE tooth_images 
SET cloudinary_url = image_url 
WHERE cloudinary_url IS NULL AND image_url IS NOT NULL;

-- Set default values for missing columns
UPDATE tooth_images 
SET file_size_bytes = 0 
WHERE file_size_bytes IS NULL;

UPDATE tooth_images 
SET description = '' 
WHERE description IS NULL;

UPDATE tooth_images 
SET cloudinary_public_id = '' 
WHERE cloudinary_public_id IS NULL;

-- =====================================================
-- 5. UPDATE THE FUNCTION TO RETURN CORRECT COLUMNS
-- =====================================================

-- Drop the old function
DROP FUNCTION IF EXISTS get_tooth_images(p_clinic_id UUID, p_patient_id UUID);

-- Create the function with correct column mapping
CREATE OR REPLACE FUNCTION get_tooth_images(
    p_clinic_id UUID,
    p_patient_id UUID
)
RETURNS TABLE (
    id UUID,
    clinic_id UUID,
    patient_id UUID,
    tooth_number VARCHAR,
    image_type VARCHAR,
    description TEXT,
    cloudinary_url TEXT,
    cloudinary_public_id TEXT,
    file_size_bytes BIGINT,
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
        COALESCE(ti.image_type, '') as image_type,
        COALESCE(ti.description, '') as description,
        COALESCE(ti.cloudinary_url, ti.image_url, '') as cloudinary_url,
        COALESCE(ti.cloudinary_public_id, '') as cloudinary_public_id,
        COALESCE(ti.file_size_bytes, 0) as file_size_bytes,
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
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION get_tooth_images(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tooth_images(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_tooth_images(UUID, UUID) TO service_role;

-- =====================================================
-- 7. VERIFICATION
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

-- Test function with sample data
SELECT 
    'function test' as test_type,
    COUNT(*) as result_count
FROM get_tooth_images(
    'c1ca557d-ca85-4905-beb7-c3985692d463'::UUID,
    (SELECT id FROM patients LIMIT 1)
);

-- Show sample data after migration
SELECT 
    'migrated data' as data_type,
    id,
    tooth_number,
    image_type,
    cloudinary_url,
    file_size_bytes,
    uploaded_at
FROM tooth_images 
LIMIT 3;

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================

SELECT '🔧 tooth_images column mismatch fixed! The frontend should now be able to display images correctly.' as status;

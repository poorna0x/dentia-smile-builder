-- Remove PDF support from tooth_images table
-- This script removes any PDF-related columns that might have been added

-- Check if file_type column exists and remove it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tooth_images' 
        AND column_name = 'file_type'
    ) THEN
        ALTER TABLE tooth_images DROP COLUMN file_type;
        RAISE NOTICE 'Removed file_type column from tooth_images table';
    ELSE
        RAISE NOTICE 'file_type column does not exist in tooth_images table';
    END IF;
END $$;

-- Drop the updated function if it exists and recreate the original
DROP FUNCTION IF EXISTS get_tooth_images(UUID, UUID);

-- Create the original get_tooth_images function (without file_type)
CREATE OR REPLACE FUNCTION get_tooth_images(
  p_clinic_id UUID,
  p_patient_id UUID
)
RETURNS TABLE (
  id UUID,
  tooth_number VARCHAR(2),
  image_type VARCHAR(20),
  description TEXT,
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,
  file_size_bytes BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ti.id,
    ti.tooth_number,
    ti.image_type,
    ti.description,
    ti.cloudinary_url,
    ti.cloudinary_public_id,
    ti.file_size_bytes,
    ti.uploaded_at
  FROM tooth_images ti
  WHERE ti.clinic_id = p_clinic_id 
    AND ti.patient_id = p_patient_id
  ORDER BY ti.tooth_number, ti.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove any PDF-related indexes
DROP INDEX IF EXISTS idx_tooth_images_file_type;

-- Success message
SELECT 'PDF support removed from tooth_images table successfully' as status;

-- Fix tooth_images table and functions
-- This script handles existing objects and ensures everything is properly set up

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on tooth images" ON tooth_images;
DROP POLICY IF EXISTS "Clinic staff can manage tooth images" ON tooth_images;
DROP POLICY IF EXISTS "Super admin can access all tooth images" ON tooth_images;

-- Drop existing trigger first (it depends on the function)
DROP TRIGGER IF EXISTS update_tooth_images_updated_at_trigger ON tooth_images;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_tooth_images(UUID, UUID);
DROP FUNCTION IF EXISTS delete_tooth_image(UUID, UUID);
DROP FUNCTION IF EXISTS update_tooth_images_updated_at() CASCADE;

-- Ensure tooth_images table exists with correct structure
CREATE TABLE IF NOT EXISTS tooth_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number VARCHAR(2) NOT NULL,
  image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('xray', 'photo', 'scan')),
  description TEXT DEFAULT '',
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_tooth_images_clinic_patient ON tooth_images(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_tooth_images_tooth_number ON tooth_images(tooth_number);
CREATE INDEX IF NOT EXISTS idx_tooth_images_type ON tooth_images(image_type);
CREATE INDEX IF NOT EXISTS idx_tooth_images_uploaded_at ON tooth_images(uploaded_at);

-- Enable RLS
ALTER TABLE tooth_images ENABLE ROW LEVEL SECURITY;

-- Create simple policy for all operations (following existing pattern)
CREATE POLICY "Allow all operations on tooth images" ON tooth_images
  FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tooth_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_tooth_images_updated_at_trigger ON tooth_images;
CREATE TRIGGER update_tooth_images_updated_at_trigger
  BEFORE UPDATE ON tooth_images
  FOR EACH ROW
  EXECUTE FUNCTION update_tooth_images_updated_at();

-- Function to get tooth images for a patient
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

-- Function to delete tooth image
CREATE OR REPLACE FUNCTION delete_tooth_image(
  p_image_id UUID,
  p_clinic_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  image_record RECORD;
BEGIN
  -- Get the image record
  SELECT * INTO image_record 
  FROM tooth_images 
  WHERE id = p_image_id AND clinic_id = p_clinic_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Delete the record
  DELETE FROM tooth_images WHERE id = p_image_id;
  
  -- Return success (Cloudinary deletion will be handled by webhook or client-side)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE tooth_images IS 'Stores metadata for dental images (X-rays, photos, scans) associated with specific teeth';
COMMENT ON COLUMN tooth_images.tooth_number IS 'Universal tooth numbering system (01-32)';
COMMENT ON COLUMN tooth_images.image_type IS 'Type of dental image: xray, photo, or scan';
COMMENT ON COLUMN tooth_images.cloudinary_url IS 'CDN URL for the image from Cloudinary';
COMMENT ON COLUMN tooth_images.cloudinary_public_id IS 'Cloudinary public ID for image management';
COMMENT ON COLUMN tooth_images.file_size_bytes IS 'Original file size in bytes for storage tracking';

-- Test the setup
SELECT 'tooth_images table and functions created successfully' as status;

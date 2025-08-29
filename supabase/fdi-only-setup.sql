-- FDI-Only Dental Numbering System Setup
-- =============================================

-- Update all existing data to use FDI numbering system
UPDATE scheduling_settings 
SET dental_numbering_system = 'fdi' 
WHERE dental_numbering_system = 'universal' OR dental_numbering_system IS NULL;

-- Update dental_treatments table to use FDI
UPDATE dental_treatments 
SET numbering_system = 'fdi' 
WHERE numbering_system = 'universal' OR numbering_system IS NULL;

-- Update tooth_conditions table to use FDI
UPDATE tooth_conditions 
SET numbering_system = 'fdi' 
WHERE numbering_system = 'universal' OR numbering_system IS NULL;

-- Update tooth_images table to use FDI
UPDATE tooth_images 
SET numbering_system = 'fdi' 
WHERE numbering_system = 'universal' OR numbering_system IS NULL;

-- Create a function to get FDI tooth information
CREATE OR REPLACE FUNCTION get_fdi_tooth_info(input_tooth_number VARCHAR)
RETURNS TABLE(
  tooth_number VARCHAR,
  quadrant INTEGER,
  tooth_position INTEGER,
  tooth_name VARCHAR,
  arch VARCHAR,
  side VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    input_tooth_number,
    CAST(SUBSTRING(input_tooth_number, 1, 1) AS INTEGER) as quadrant,
    CAST(SUBSTRING(input_tooth_number, 2, 1) AS INTEGER) as position,
    CASE CAST(SUBSTRING(input_tooth_number, 2, 1) AS INTEGER)
      WHEN 1 THEN 'Central Incisor'
      WHEN 2 THEN 'Lateral Incisor'
      WHEN 3 THEN 'Canine'
      WHEN 4 THEN 'First Premolar'
      WHEN 5 THEN 'Second Premolar'
      WHEN 6 THEN 'First Molar'
      WHEN 7 THEN 'Second Molar'
      WHEN 8 THEN 'Third Molar'
      ELSE 'Unknown'
    END as tooth_name,
    CASE CAST(SUBSTRING(input_tooth_number, 1, 1) AS INTEGER)
      WHEN 1 THEN 'Maxillary'
      WHEN 2 THEN 'Maxillary'
      WHEN 3 THEN 'Mandibular'
      WHEN 4 THEN 'Mandibular'
      ELSE 'Unknown'
    END as arch,
    CASE CAST(SUBSTRING(input_tooth_number, 1, 1) AS INTEGER)
      WHEN 1 THEN 'Right'
      WHEN 2 THEN 'Left'
      WHEN 3 THEN 'Left'
      WHEN 4 THEN 'Right'
      ELSE 'Unknown'
    END as side;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_fdi_tooth_info(VARCHAR) TO authenticated;

-- Create a view for all FDI teeth
CREATE OR REPLACE VIEW fdi_teeth_view AS
SELECT 
  '18' as tooth_number, 1 as quadrant, 8 as tooth_position, 'Third Molar' as tooth_name, 'Maxillary' as arch, 'Right' as side UNION ALL
SELECT '17', 1, 7, 'Second Molar', 'Maxillary', 'Right' UNION ALL
SELECT '16', 1, 6, 'First Molar', 'Maxillary', 'Right' UNION ALL
SELECT '15', 1, 5, 'Second Premolar', 'Maxillary', 'Right' UNION ALL
SELECT '14', 1, 4, 'First Premolar', 'Maxillary', 'Right' UNION ALL
SELECT '13', 1, 3, 'Canine', 'Maxillary', 'Right' UNION ALL
SELECT '12', 1, 2, 'Lateral Incisor', 'Maxillary', 'Right' UNION ALL
SELECT '11', 1, 1, 'Central Incisor', 'Maxillary', 'Right' UNION ALL
SELECT '21', 2, 1, 'Central Incisor', 'Maxillary', 'Left' UNION ALL
SELECT '22', 2, 2, 'Lateral Incisor', 'Maxillary', 'Left' UNION ALL
SELECT '23', 2, 3, 'Canine', 'Maxillary', 'Left' UNION ALL
SELECT '24', 2, 4, 'First Premolar', 'Maxillary', 'Left' UNION ALL
SELECT '25', 2, 5, 'Second Premolar', 'Maxillary', 'Left' UNION ALL
SELECT '26', 2, 6, 'First Molar', 'Maxillary', 'Left' UNION ALL
SELECT '27', 2, 7, 'Second Molar', 'Maxillary', 'Left' UNION ALL
SELECT '28', 2, 8, 'Third Molar', 'Maxillary', 'Left' UNION ALL
SELECT '31', 3, 1, 'Central Incisor', 'Mandibular', 'Left' UNION ALL
SELECT '32', 3, 2, 'Lateral Incisor', 'Mandibular', 'Left' UNION ALL
SELECT '33', 3, 3, 'Canine', 'Mandibular', 'Left' UNION ALL
SELECT '34', 3, 4, 'First Premolar', 'Mandibular', 'Left' UNION ALL
SELECT '35', 3, 5, 'Second Premolar', 'Mandibular', 'Left' UNION ALL
SELECT '36', 3, 6, 'First Molar', 'Mandibular', 'Left' UNION ALL
SELECT '37', 3, 7, 'Second Molar', 'Mandibular', 'Left' UNION ALL
SELECT '38', 3, 8, 'Third Molar', 'Mandibular', 'Left' UNION ALL
SELECT '41', 4, 1, 'Central Incisor', 'Mandibular', 'Right' UNION ALL
SELECT '42', 4, 2, 'Lateral Incisor', 'Mandibular', 'Right' UNION ALL
SELECT '43', 4, 3, 'Canine', 'Mandibular', 'Right' UNION ALL
SELECT '44', 4, 4, 'First Premolar', 'Mandibular', 'Right' UNION ALL
SELECT '45', 4, 5, 'Second Premolar', 'Mandibular', 'Right' UNION ALL
SELECT '46', 4, 6, 'First Molar', 'Mandibular', 'Right' UNION ALL
SELECT '47', 4, 7, 'Second Molar', 'Mandibular', 'Right' UNION ALL
SELECT '48', 4, 8, 'Third Molar', 'Mandibular', 'Right';

-- Grant select permission on the view
GRANT SELECT ON fdi_teeth_view TO authenticated;

-- Create a function to get treatments by quadrant
CREATE OR REPLACE FUNCTION get_treatments_by_quadrant(clinic_uuid UUID, quadrant_num INTEGER)
RETURNS TABLE(
  patient_name VARCHAR,
  tooth_number VARCHAR,
  treatment_name VARCHAR,
  treatment_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.full_name as patient_name,
    dt.tooth_number,
    dt.treatment_name,
    dt.treatment_date
  FROM dental_treatments dt
  JOIN patients p ON dt.patient_id = p.id
  WHERE dt.clinic_id = clinic_uuid
    AND dt.numbering_system = 'fdi'
    AND CAST(SUBSTRING(dt.tooth_number, 1, 1) AS INTEGER) = quadrant_num
  ORDER BY dt.treatment_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_treatments_by_quadrant(UUID, INTEGER) TO authenticated;

-- Create a function to get treatments by arch
CREATE OR REPLACE FUNCTION get_treatments_by_arch(clinic_uuid UUID, arch_name VARCHAR)
RETURNS TABLE(
  patient_name VARCHAR,
  tooth_number VARCHAR,
  treatment_name VARCHAR,
  treatment_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.full_name as patient_name,
    dt.tooth_number,
    dt.treatment_name,
    dt.treatment_date
  FROM dental_treatments dt
  JOIN patients p ON dt.patient_id = p.id
  WHERE dt.clinic_id = clinic_uuid
    AND dt.numbering_system = 'fdi'
    AND CASE CAST(SUBSTRING(dt.tooth_number, 1, 1) AS INTEGER)
      WHEN 1 THEN 'Maxillary'
      WHEN 2 THEN 'Maxillary'
      WHEN 3 THEN 'Mandibular'
      WHEN 4 THEN 'Mandibular'
      ELSE 'Unknown'
    END = arch_name
  ORDER BY dt.treatment_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_treatments_by_arch(UUID, VARCHAR) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_fdi_tooth_info(VARCHAR) IS 'Get detailed information about an FDI tooth number';
COMMENT ON VIEW fdi_teeth_view IS 'Complete view of all 32 teeth in FDI numbering system';
COMMENT ON FUNCTION get_treatments_by_quadrant(UUID, INTEGER) IS 'Get all treatments for a specific quadrant (1-4)';
COMMENT ON FUNCTION get_treatments_by_arch(UUID, VARCHAR) IS 'Get all treatments for a specific arch (Maxillary/Mandibular)';

-- Verify the setup
SELECT 'FDI Setup Complete' as status, COUNT(*) as total_teeth FROM fdi_teeth_view;

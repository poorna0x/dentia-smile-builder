-- =====================================================
-- 🦷 TOOTH NUMBERING SYSTEM SUPPORT
-- =====================================================

-- Add numbering_system column to dental_treatments table
ALTER TABLE dental_treatments 
ADD COLUMN IF NOT EXISTS numbering_system TEXT DEFAULT 'universal' 
CHECK (numbering_system IN ('universal', 'fdi'));

-- Add numbering_system column to tooth_conditions table
ALTER TABLE tooth_conditions 
ADD COLUMN IF NOT EXISTS numbering_system TEXT DEFAULT 'universal' 
CHECK (numbering_system IN ('universal', 'fdi'));

-- Add numbering_system column to tooth_images table
ALTER TABLE tooth_images 
ADD COLUMN IF NOT EXISTS numbering_system TEXT DEFAULT 'universal' 
CHECK (numbering_system IN ('universal', 'fdi'));

-- Create indexes for numbering system queries
CREATE INDEX IF NOT EXISTS idx_dental_treatments_numbering_system ON dental_treatments(numbering_system);
CREATE INDEX IF NOT EXISTS idx_tooth_conditions_numbering_system ON tooth_conditions(numbering_system);
CREATE INDEX IF NOT EXISTS idx_tooth_images_numbering_system ON tooth_images(numbering_system);

-- Create function to get tooth position based on numbering system
CREATE OR REPLACE FUNCTION get_tooth_position(tooth_number TEXT, numbering_system TEXT)
RETURNS TEXT AS $$
BEGIN
  IF numbering_system = 'universal' THEN
    -- Universal numbering system (1-32)
    CASE 
      WHEN tooth_number::int BETWEEN 1 AND 8 THEN RETURN 'Maxillary Right';
      WHEN tooth_number::int BETWEEN 9 AND 16 THEN RETURN 'Maxillary Left';
      WHEN tooth_number::int BETWEEN 17 AND 24 THEN RETURN 'Mandibular Left';
      WHEN tooth_number::int BETWEEN 25 AND 32 THEN RETURN 'Mandibular Right';
      ELSE RETURN 'Unknown';
    END CASE;
  ELSE
    -- FDI numbering system
    CASE 
      WHEN LEFT(tooth_number, 1) = '1' THEN RETURN 'Maxillary Right';
      WHEN LEFT(tooth_number, 1) = '2' THEN RETURN 'Maxillary Left';
      WHEN LEFT(tooth_number, 1) = '3' THEN RETURN 'Mandibular Left';
      WHEN LEFT(tooth_number, 1) = '4' THEN RETURN 'Mandibular Right';
      ELSE RETURN 'Unknown';
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get tooth name based on numbering system
CREATE OR REPLACE FUNCTION get_tooth_name(tooth_number TEXT, numbering_system TEXT)
RETURNS TEXT AS $$
DECLARE
  position INT;
BEGIN
  IF numbering_system = 'universal' THEN
    -- Universal numbering system
    position := ((tooth_number::int - 1) % 8) + 1;
  ELSE
    -- FDI numbering system
    position := RIGHT(tooth_number, 1)::int;
  END IF;

  -- Tooth names based on position (from mesial to distal)
  CASE position
    WHEN 1 THEN RETURN 'Central Incisor';
    WHEN 2 THEN RETURN 'Lateral Incisor';
    WHEN 3 THEN RETURN 'Canine';
    WHEN 4 THEN RETURN 'First Premolar';
    WHEN 5 THEN RETURN 'Second Premolar';
    WHEN 6 THEN RETURN 'First Molar';
    WHEN 7 THEN RETURN 'Second Molar';
    WHEN 8 THEN RETURN 'Third Molar';
    ELSE RETURN 'Unknown';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to convert between numbering systems
CREATE OR REPLACE FUNCTION convert_tooth_numbering(tooth_number TEXT, from_system TEXT, to_system TEXT)
RETURNS TEXT AS $$
DECLARE
  quadrant INT;
  position INT;
  universal_num INT;
BEGIN
  IF from_system = to_system THEN
    RETURN tooth_number;
  END IF;

  IF from_system = 'universal' AND to_system = 'fdi' THEN
    -- Universal to FDI
    universal_num := tooth_number::int;
    CASE 
      WHEN universal_num BETWEEN 1 AND 8 THEN quadrant := 1;
      WHEN universal_num BETWEEN 9 AND 16 THEN quadrant := 2;
      WHEN universal_num BETWEEN 17 AND 24 THEN quadrant := 3;
      WHEN universal_num BETWEEN 25 AND 32 THEN quadrant := 4;
      ELSE RETURN tooth_number;
    END CASE;
    position := ((universal_num - 1) % 8) + 1;
    RETURN quadrant::text || position::text;
  ELSIF from_system = 'fdi' AND to_system = 'universal' THEN
    -- FDI to Universal
    quadrant := LEFT(tooth_number, 1)::int;
    position := RIGHT(tooth_number, 1)::int;
    universal_num := (quadrant - 1) * 8 + position;
    RETURN universal_num::text;
  END IF;

  RETURN tooth_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to get quadrant number
CREATE OR REPLACE FUNCTION get_tooth_quadrant(tooth_number TEXT, numbering_system TEXT)
RETURNS INT AS $$
BEGIN
  IF numbering_system = 'universal' THEN
    CASE 
      WHEN tooth_number::int BETWEEN 1 AND 8 THEN RETURN 1;
      WHEN tooth_number::int BETWEEN 9 AND 16 THEN RETURN 2;
      WHEN tooth_number::int BETWEEN 17 AND 24 THEN RETURN 3;
      WHEN tooth_number::int BETWEEN 25 AND 32 THEN RETURN 4;
      ELSE RETURN 0;
    END CASE;
  ELSE
    -- FDI numbering system
    RETURN LEFT(tooth_number, 1)::int;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get tooth type (anterior/posterior)
CREATE OR REPLACE FUNCTION get_tooth_type(tooth_number TEXT, numbering_system TEXT)
RETURNS TEXT AS $$
DECLARE
  position INT;
BEGIN
  IF numbering_system = 'universal' THEN
    position := ((tooth_number::int - 1) % 8) + 1;
  ELSE
    position := RIGHT(tooth_number, 1)::int;
  END IF;

  IF position <= 3 THEN
    RETURN 'Anterior';  -- Incisors and Canines
  ELSE
    RETURN 'Posterior'; -- Premolars and Molars
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get arch (maxillary/mandibular)
CREATE OR REPLACE FUNCTION get_tooth_arch(tooth_number TEXT, numbering_system TEXT)
RETURNS TEXT AS $$
BEGIN
  IF numbering_system = 'universal' THEN
    CASE 
      WHEN tooth_number::int BETWEEN 1 AND 16 THEN RETURN 'Maxillary';
      WHEN tooth_number::int BETWEEN 17 AND 32 THEN RETURN 'Mandibular';
      ELSE RETURN 'Unknown';
    END CASE;
  ELSE
    -- FDI numbering system
    CASE 
      WHEN LEFT(tooth_number, 1) IN ('1', '2') THEN RETURN 'Maxillary';
      WHEN LEFT(tooth_number, 1) IN ('3', '4') THEN RETURN 'Mandibular';
      ELSE RETURN 'Unknown';
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get side (left/right)
CREATE OR REPLACE FUNCTION get_tooth_side(tooth_number TEXT, numbering_system TEXT)
RETURNS TEXT AS $$
BEGIN
  IF numbering_system = 'universal' THEN
    CASE 
      WHEN tooth_number::int IN (1,2,3,4,5,6,7,8,25,26,27,28,29,30,31,32) THEN RETURN 'Right';
      WHEN tooth_number::int IN (9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24) THEN RETURN 'Left';
      ELSE RETURN 'Unknown';
    END CASE;
  ELSE
    -- FDI numbering system
    CASE 
      WHEN LEFT(tooth_number, 1) IN ('1', '4') THEN RETURN 'Right';
      WHEN LEFT(tooth_number, 1) IN ('2', '3') THEN RETURN 'Left';
      ELSE RETURN 'Unknown';
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for tooth information with all details
CREATE OR REPLACE VIEW tooth_information AS
SELECT 
  t.id,
  t.clinic_id,
  t.patient_id,
  t.tooth_number,
  t.numbering_system,
  get_tooth_position(t.tooth_number, t.numbering_system) as tooth_position,
  get_tooth_name(t.tooth_number, t.numbering_system) as tooth_name,
  get_tooth_quadrant(t.tooth_number, t.numbering_system) as quadrant,
  get_tooth_type(t.tooth_number, t.numbering_system) as tooth_type,
  get_tooth_arch(t.tooth_number, t.numbering_system) as arch,
  get_tooth_side(t.tooth_number, t.numbering_system) as side,
  convert_tooth_numbering(t.tooth_number, t.numbering_system, 'universal') as universal_number,
  convert_tooth_numbering(t.tooth_number, t.numbering_system, 'fdi') as fdi_number,
  t.treatment_type,
  t.treatment_status,
  t.treatment_date,
  t.created_at
FROM dental_treatments t;

-- Create function to get treatments by quadrant
CREATE OR REPLACE FUNCTION get_treatments_by_quadrant(
  patient_uuid UUID, 
  clinic_uuid UUID, 
  quadrant_num INT, 
  numbering_system TEXT DEFAULT 'universal'
)
RETURNS TABLE (
  tooth_number TEXT,
  tooth_position TEXT,
  tooth_name TEXT,
  treatment_type TEXT,
  treatment_status TEXT,
  treatment_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.tooth_number,
    get_tooth_position(dt.tooth_number, dt.numbering_system) as tooth_position,
    get_tooth_name(dt.tooth_number, dt.numbering_system) as tooth_name,
    dt.treatment_type,
    dt.treatment_status,
    dt.treatment_date
  FROM dental_treatments dt
  WHERE dt.patient_id = patient_uuid 
    AND dt.clinic_id = clinic_uuid
    AND get_tooth_quadrant(dt.tooth_number, dt.numbering_system) = quadrant_num
  ORDER BY dt.tooth_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to get treatments by arch
CREATE OR REPLACE FUNCTION get_treatments_by_arch(
  patient_uuid UUID, 
  clinic_uuid UUID, 
  arch_name TEXT, 
  numbering_system TEXT DEFAULT 'universal'
)
RETURNS TABLE (
  tooth_number TEXT,
  tooth_position TEXT,
  tooth_name TEXT,
  treatment_type TEXT,
  treatment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.tooth_number,
    get_tooth_position(dt.tooth_number, dt.numbering_system) as tooth_position,
    get_tooth_name(dt.tooth_number, dt.numbering_system) as tooth_name,
    dt.treatment_type,
    dt.treatment_status
  FROM dental_treatments dt
  WHERE dt.patient_id = patient_uuid 
    AND dt.clinic_id = clinic_uuid
    AND get_tooth_arch(dt.tooth_number, dt.numbering_system) = arch_name
  ORDER BY dt.tooth_number;
END;
$$ LANGUAGE plpgsql;

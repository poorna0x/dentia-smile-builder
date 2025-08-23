-- =====================================================
-- 🔧 FIX MIGRATION FUNCTION
-- =====================================================
-- 
-- This fixes the ambiguous column reference error
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop the problematic function first
DROP FUNCTION IF EXISTS migrate_appointments_to_patients();

-- Recreate the function with proper variable naming
CREATE OR REPLACE FUNCTION migrate_appointments_to_patients()
RETURNS void AS $$
DECLARE
    appointment_record RECORD;
    v_patient_id UUID;
    migrated_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting appointment migration...';
    
    FOR appointment_record IN 
        SELECT a.id, a.clinic_id, a.name, a.phone, a.email
        FROM appointments a
        WHERE a.patient_id IS NULL
    LOOP
        BEGIN
            -- Find or create patient for this appointment
            v_patient_id := find_or_create_patient(
                appointment_record.name,
                appointment_record.phone,
                appointment_record.email,
                appointment_record.clinic_id
            );
            
            -- Update appointment with patient_id
            UPDATE appointments 
            SET patient_id = v_patient_id
            WHERE id = appointment_record.id;
            
            migrated_count := migrated_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error migrating appointment %: %', appointment_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Migrated: %, Errors: %', migrated_count, error_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ✅ NOW RUN THE MIGRATION
-- =====================================================
-- 
-- After running this fix, execute:
-- SELECT migrate_appointments_to_patients();
-- 
-- =====================================================

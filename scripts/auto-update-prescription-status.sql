-- Auto-update prescription status based on duration
-- This script creates functions and triggers to automatically change prescription status from Active to Completed

-- Function to calculate end date from duration
CREATE OR REPLACE FUNCTION calculate_prescription_end_date(
    p_prescribed_date DATE,
    p_duration VARCHAR(100)
)
RETURNS DATE AS $$
DECLARE
    duration_value INTEGER;
    duration_unit VARCHAR(20);
    end_date DATE;
BEGIN
    -- Parse duration (e.g., "7 days", "2 weeks", "1 month")
    duration_value := CAST(SPLIT_PART(p_duration, ' ', 1) AS INTEGER);
    duration_unit := LOWER(SPLIT_PART(p_duration, ' ', 2));
    
    CASE duration_unit
        WHEN 'day', 'days' THEN
            end_date := p_prescribed_date + (duration_value || ' days')::INTERVAL;
        WHEN 'week', 'weeks' THEN
            end_date := p_prescribed_date + (duration_value || ' weeks')::INTERVAL;
        WHEN 'month', 'months' THEN
            end_date := p_prescribed_date + (duration_value || ' months')::INTERVAL;
        WHEN 'year', 'years' THEN
            end_date := p_prescribed_date + (duration_value || ' years')::INTERVAL;
        ELSE
            -- Default to days if unit is not recognized
            end_date := p_prescribed_date + (duration_value || ' days')::INTERVAL;
    END CASE;
    
    RETURN end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update expired prescriptions
CREATE OR REPLACE FUNCTION check_and_update_expired_prescriptions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    prescription_record RECORD;
    end_date DATE;
BEGIN
    -- Loop through all active prescriptions
    FOR prescription_record IN 
        SELECT 
            id,
            prescribed_date,
            duration,
            clinic_id
        FROM prescriptions 
        WHERE status = 'Active'
    LOOP
        -- Calculate end date for this prescription
        end_date := calculate_prescription_end_date(
            prescription_record.prescribed_date, 
            prescription_record.duration
        );
        
        -- If current date is past the end date, mark as completed
        IF CURRENT_DATE > end_date THEN
            -- Update prescription status to completed
            UPDATE prescriptions 
            SET status = 'Completed',
                updated_at = NOW()
            WHERE id = prescription_record.id;
            
            -- Log the status change in history
            INSERT INTO prescription_history (
                prescription_id,
                action,
                action_by,
                notes
            ) VALUES (
                prescription_record.id,
                'Status Changed',
                'System',
                'Automatically completed after duration ended on ' || end_date
            );
            
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get prescription status with auto-completion check
CREATE OR REPLACE FUNCTION get_prescription_status_with_check(p_prescription_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    prescription_status VARCHAR(50);
    prescription_record RECORD;
    end_date DATE;
BEGIN
    -- Get prescription details
    SELECT status, prescribed_date, duration INTO prescription_record
    FROM prescriptions 
    WHERE id = p_prescription_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- If already completed, return current status
    IF prescription_record.status != 'Active' THEN
        RETURN prescription_record.status;
    END IF;
    
    -- Calculate end date
    end_date := calculate_prescription_end_date(
        prescription_record.prescribed_date, 
        prescription_record.duration
    );
    
    -- If expired, update status and return completed
    IF CURRENT_DATE > end_date THEN
        -- Update prescription status to completed
        UPDATE prescriptions 
        SET status = 'Completed',
            updated_at = NOW()
        WHERE id = p_prescription_id;
        
        -- Log the status change in history
        INSERT INTO prescription_history (
            prescription_id,
            action,
            action_by,
            notes
        ) VALUES (
            p_prescription_id,
            'Status Changed',
            'System',
            'Automatically completed after duration ended on ' || end_date
        );
        
        RETURN 'Completed';
    END IF;
    
    -- Return current status if not expired
    RETURN prescription_record.status;
END;
$$ LANGUAGE plpgsql;

-- Function to get active prescriptions with auto-completion check
CREATE OR REPLACE FUNCTION get_active_prescriptions_with_auto_check(p_patient_id UUID, p_clinic_id UUID)
RETURNS TABLE (
    id UUID,
    medication_name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    prescribed_date DATE,
    prescribed_by VARCHAR(255),
    status VARCHAR(50),
    refills_remaining INTEGER,
    refill_quantity VARCHAR(100),
    pharmacy_notes TEXT,
    patient_notes TEXT,
    side_effects TEXT,
    interactions TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    end_date DATE
) AS $$
DECLARE
    prescription_record RECORD;
    calculated_end_date DATE;
BEGIN
    -- First, check and update any expired prescriptions
    PERFORM check_and_update_expired_prescriptions();
    
    -- Return active prescriptions with calculated end dates
    RETURN QUERY
    SELECT 
        p.id,
        p.medication_name,
        p.dosage,
        p.frequency,
        p.duration,
        p.instructions,
        p.prescribed_date,
        p.prescribed_by,
        p.status,
        p.refills_remaining,
        p.refill_quantity,
        p.pharmacy_notes,
        p.patient_notes,
        p.side_effects,
        p.interactions,
        p.created_at,
        calculate_prescription_end_date(p.prescribed_date, p.duration) as end_date
    FROM prescriptions p
    WHERE p.patient_id = p_patient_id 
    AND p.clinic_id = p_clinic_id
    AND p.status = 'Active'
    ORDER BY p.prescribed_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job function (for manual execution)
CREATE OR REPLACE FUNCTION run_prescription_status_update()
RETURNS TEXT AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    updated_count := check_and_update_expired_prescriptions();
    RETURN 'Updated ' || updated_count || ' prescriptions from Active to Completed';
END;
$$ LANGUAGE plpgsql;

-- Test the functions
-- SELECT run_prescription_status_update();

-- Example usage:
-- SELECT get_prescription_status_with_check('prescription-id-here');
-- SELECT * FROM get_active_prescriptions_with_auto_check('patient-id-here', 'clinic-id-here');

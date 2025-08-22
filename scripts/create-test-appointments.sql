-- Create Test Appointments for Patient
-- Run this in Supabase SQL Editor

-- Get patient ID
DO $$
DECLARE
    patient_uuid UUID;
    clinic_uuid UUID;
BEGIN
    -- Get patient ID
    SELECT id INTO patient_uuid 
    FROM patients 
    WHERE phone = '6361631253' 
    LIMIT 1;
    
    -- Get clinic ID
    SELECT id INTO clinic_uuid 
    FROM clinics 
    LIMIT 1;
    
    -- Insert test appointments
    INSERT INTO appointments (
        clinic_id,
        name,
        email,
        phone,
        date,
        time,
        status,
        patient_id,
        created_at,
        updated_at
    ) VALUES 
    (
        clinic_uuid,
        'Poorna',
        'poorna8105@gmail.com',
        '6361631253',
        '2024-01-15',
        '10:00',
        'Confirmed',
        patient_uuid,
        NOW(),
        NOW()
    ),
    (
        clinic_uuid,
        'Poorna',
        'poorna8105@gmail.com',
        '6361631253',
        '2024-01-20',
        '14:30',
        'Confirmed',
        patient_uuid,
        NOW(),
        NOW()
    ),
    (
        clinic_uuid,
        'Poorna',
        'poorna8105@gmail.com',
        '6361631253',
        '2024-02-01',
        '09:00',
        'Scheduled',
        patient_uuid,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created 3 test appointments for patient: %', patient_uuid;
END $$;

-- Show created appointments
SELECT 'CREATED APPOINTMENTS' as check_type;
SELECT 
    a.id,
    a.name,
    a.phone,
    a.date,
    a.time,
    a.status,
    a.patient_id,
    p.first_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.phone = '6361631253'
ORDER BY a.date DESC;

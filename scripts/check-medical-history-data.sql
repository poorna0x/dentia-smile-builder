-- Check Medical History Data
-- This script helps identify what medical history data exists for patients

-- 1. Check what tables contain medical history information
SELECT 'Available Medical History Tables' as info;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN (
    'dental_treatments', 
    'tooth_conditions', 
    'dental_notes', 
    'prescriptions', 
    'appointments',
    'lab_work',
    'treatment_plans'
)
AND column_name LIKE '%note%' OR column_name LIKE '%description%' OR column_name LIKE '%history%'
ORDER BY table_name, column_name;

-- 2. Check if treatment_plans table exists and has data
SELECT 'Treatment Plans Table Check' as info;
SELECT 
    COUNT(*) as treatment_plans_count
FROM information_schema.tables 
WHERE table_name = 'treatment_plans';

-- If treatment_plans exists, show sample data
SELECT 'Sample Treatment Plans Data' as info;
SELECT 
    id, patient_id, clinic_id, created_at
FROM treatment_plans 
LIMIT 5;

-- 3. Check dental_notes table (if exists)
SELECT 'Dental Notes Table Check' as info;
SELECT 
    COUNT(*) as dental_notes_count
FROM information_schema.tables 
WHERE table_name = 'dental_notes';

-- If dental_notes exists, show sample data
SELECT 'Sample Dental Notes Data' as info;
SELECT 
    id, patient_id, clinic_id, note_type, title, content, created_at
FROM dental_notes 
LIMIT 5;

-- 4. Check what medical history data exists for patient 6361631253
SELECT 'Medical History for Patient 6361631253' as info;

-- Dental treatments
SELECT 'Dental Treatments' as data_type, COUNT(*) as count
FROM dental_treatments dt
JOIN patients p ON dt.patient_id = p.id
WHERE p.phone = '6361631253';

-- Tooth conditions
SELECT 'Tooth Conditions' as data_type, COUNT(*) as count
FROM tooth_conditions tc
JOIN patients p ON tc.patient_id = p.id
WHERE p.phone = '6361631253';

-- Prescriptions
SELECT 'Prescriptions' as data_type, COUNT(*) as count
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.id
WHERE p.phone = '6361631253';

-- Appointments
SELECT 'Appointments' as data_type, COUNT(*) as count
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE p.phone = '6361631253';

-- Lab work
SELECT 'Lab Work' as data_type, COUNT(*) as count
FROM lab_work lw
JOIN patients p ON lw.patient_id = p.id
WHERE p.phone = '6361631253';

-- 5. Show comprehensive medical history for patient 6361631253
SELECT 'Comprehensive Medical History for Patient 6361631253' as info;

-- Dental treatments with details
SELECT 
    'Dental Treatment' as record_type,
    dt.treatment_type,
    dt.treatment_description,
    dt.treatment_status,
    dt.treatment_date,
    dt.notes,
    dt.created_at
FROM dental_treatments dt
JOIN patients p ON dt.patient_id = p.id
WHERE p.phone = '6361631253'
ORDER BY dt.created_at DESC;

-- Tooth conditions with details
SELECT 
    'Tooth Condition' as record_type,
    tc.condition_type,
    tc.condition_description,
    tc.severity,
    tc.notes,
    tc.created_at
FROM tooth_conditions tc
JOIN patients p ON tc.patient_id = p.id
WHERE p.phone = '6361631253'
ORDER BY tc.created_at DESC;

-- Prescriptions with details
SELECT 
    'Prescription' as record_type,
    pr.medication_name,
    pr.dosage,
    pr.frequency,
    pr.instructions,
    pr.notes,
    pr.prescribed_date
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.id
WHERE p.phone = '6361631253'
ORDER BY pr.prescribed_date DESC;

-- Lab work with details
SELECT 
    'Lab Work' as record_type,
    lw.work_type,
    lw.description,
    lw.status,
    lw.notes,
    lw.order_date
FROM lab_work lw
JOIN patients p ON lw.patient_id = p.id
WHERE p.phone = '6361631253'
ORDER BY lw.order_date DESC;

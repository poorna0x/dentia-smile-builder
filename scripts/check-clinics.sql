-- Check Clinics Table
-- Run this in Supabase SQL Editor

-- Check if clinics table exists
SELECT 'CLINICS TABLE EXISTS' as check_type;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'clinics'
) as table_exists;

-- Count clinics
SELECT 'CLINIC COUNT' as check_type;
SELECT COUNT(*) as clinic_count FROM clinics;

-- Show clinic data
SELECT 'CLINIC DATA' as check_type;
SELECT id, name, slug, contact_phone, contact_email 
FROM clinics 
ORDER BY created_at DESC;

-- If no clinics exist, insert a default one
INSERT INTO clinics (name, slug, contact_phone, contact_email, address) 
SELECT 'Jeshna Dental Clinic', 'jeshna-dental', '6363116263', 'contact@jeshnadentalclinic.com', 'Bangalore, Karnataka'
WHERE NOT EXISTS (SELECT 1 FROM clinics WHERE slug = 'jeshna-dental');

-- Show final clinic data
SELECT 'FINAL CLINIC DATA' as check_type;
SELECT id, name, slug, contact_phone, contact_email 
FROM clinics 
ORDER BY created_at DESC;

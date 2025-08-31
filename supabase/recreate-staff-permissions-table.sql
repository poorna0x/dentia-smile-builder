-- =====================================================
-- 🔧 RECREATE STAFF PERMISSIONS TABLE
-- =====================================================
-- 
-- This script completely recreates the staff_permissions table with:
-- 1. Correct column structure
-- 2. Proper unique constraint on clinic_id
-- 3. All necessary permissions columns
-- 
-- =====================================================

-- Step 1: Drop the existing table completely
DROP TABLE IF EXISTS staff_permissions CASCADE;

-- Step 2: Create the table with correct structure
CREATE TABLE staff_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  can_access_settings BOOLEAN DEFAULT FALSE,
  can_access_patient_portal BOOLEAN DEFAULT FALSE,
  can_access_payment_analytics BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_permissions_clinic_id ON staff_permissions(clinic_id);

-- Step 4: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_permissions_updated_at 
    BEFORE UPDATE ON staff_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable Row Level Security
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
DROP POLICY IF EXISTS "Allow all operations on staff_permissions" ON staff_permissions;
CREATE POLICY "Allow all operations on staff_permissions" ON staff_permissions
    FOR ALL USING (true);

-- Step 7: Insert default permissions for all clinics
INSERT INTO staff_permissions (clinic_id, can_access_settings, can_access_patient_portal, can_access_payment_analytics)
SELECT id, FALSE, FALSE, FALSE
FROM clinics;

-- Step 8: Verify the table structure
SELECT '=== VERIFIED TABLE STRUCTURE ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_permissions'
ORDER BY ordinal_position;

-- Step 9: Verify constraints
SELECT '=== VERIFIED CONSTRAINTS ===' as section;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'staff_permissions'
ORDER BY tc.constraint_type, kcu.column_name;

-- Step 10: Test upsert functionality
SELECT '=== TESTING UPSERT ===' as section;

-- Test that upsert works by updating a record
UPDATE staff_permissions 
SET 
    can_access_settings = TRUE,
    can_access_patient_portal = TRUE,
    can_access_payment_analytics = TRUE,
    updated_at = NOW()
WHERE clinic_id IN (SELECT id FROM clinics LIMIT 1);

-- Step 11: Show final data
SELECT '=== FINAL DATA ===' as section;

SELECT 
    clinic_id,
    can_access_settings,
    can_access_patient_portal,
    can_access_payment_analytics,
    created_at,
    updated_at
FROM staff_permissions
LIMIT 3;

SELECT '=== TABLE RECREATED SUCCESSFULLY ===' as section;

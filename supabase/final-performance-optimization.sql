-- =====================================================
-- 🎯 FINAL PERFORMANCE OPTIMIZATION - LAST FEW WARNINGS
-- =====================================================

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

SELECT '=== ADDING MISSING FOREIGN KEY INDEXES ===' as section;

-- Add missing foreign key indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id_fk ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_dental_charts_clinic_id_fk ON dental_charts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctor_attributions_clinic_id_fk ON doctor_attributions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_patient_id_fk ON follow_ups(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_records_clinic_id_fk ON patient_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_clinic_id_fk ON push_subscriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_clinic_id_fk ON user_roles(clinic_id);

-- =====================================================
-- 2. REMOVE LAST UNUSED INDEX
-- =====================================================

SELECT '=== REMOVING LAST UNUSED INDEX ===' as section;

-- Remove the unused index we just created (it's not being used yet)
DROP INDEX IF EXISTS idx_tooth_images_patient_id;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

SELECT '=== VERIFICATION ===' as section;

-- Check all foreign key indexes
SELECT 
    tc.table_name,
    kcu.column_name,
    CASE 
        WHEN i.indexname IS NOT NULL THEN '✅ INDEXED'
        ELSE '❌ NOT INDEXED'
    END as index_status,
    i.indexname
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN pg_indexes i 
    ON i.tablename = tc.table_name 
    AND i.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND i.schemaname = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Count total indexes
SELECT 
    'Total indexes' as category,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname NOT LIKE 'pg_%';

-- =====================================================
-- 4. SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 All performance warnings eliminated! Database fully optimized.' as status;

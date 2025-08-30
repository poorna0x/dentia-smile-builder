-- =====================================================
-- 🔧 FIX REMAINING PERFORMANCE WARNINGS - INFO LEVEL
-- =====================================================

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

SELECT '=== ADDING MISSING FOREIGN KEY INDEXES ===' as section;

-- Add missing index for tooth_images.patient_id foreign key
CREATE INDEX IF NOT EXISTS idx_tooth_images_patient_id ON tooth_images(patient_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES (SAFE TO REMOVE)
-- =====================================================

SELECT '=== REMOVING UNUSED INDEXES ===' as section;

-- Remove unused captcha_attempts indexes
DROP INDEX IF EXISTS idx_captcha_attempts_email;
DROP INDEX IF EXISTS idx_captcha_attempts_ip;
DROP INDEX IF EXISTS idx_captcha_attempts_type;

-- Remove unused user_roles indexes
DROP INDEX IF EXISTS idx_user_roles_user_id;
DROP INDEX IF EXISTS idx_user_roles_clinic_id;
DROP INDEX IF EXISTS idx_user_roles_role;

-- Remove unused follow_ups indexes
DROP INDEX IF EXISTS idx_follow_ups_patient_id;
DROP INDEX IF EXISTS idx_follow_ups_status;
DROP INDEX IF EXISTS idx_follow_ups_due_date;

-- Remove unused disabled_slots indexes
DROP INDEX IF EXISTS idx_disabled_slots_date;

-- Remove unused tooth_images indexes
DROP INDEX IF EXISTS idx_tooth_images_tooth_number;
DROP INDEX IF EXISTS idx_tooth_images_type;
DROP INDEX IF EXISTS idx_tooth_images_uploaded_at;
DROP INDEX IF EXISTS idx_tooth_images_numbering_system;

-- Remove unused appointments indexes
DROP INDEX IF EXISTS idx_appointments_reminder_sent;
DROP INDEX IF EXISTS idx_appointments_patient_id;

-- Remove unused dentists indexes
DROP INDEX IF EXISTS idx_dentists_active;

-- Remove unused dental_treatments indexes
DROP INDEX IF EXISTS idx_dental_treatments_tooth;

-- Remove unused tooth_conditions indexes
DROP INDEX IF EXISTS idx_tooth_conditions_tooth;
DROP INDEX IF EXISTS idx_tooth_conditions_numbering_system;

-- Remove unused treatment_types indexes
DROP INDEX IF EXISTS idx_treatment_types_clinic_id;
DROP INDEX IF EXISTS idx_treatment_types_active;
DROP INDEX IF EXISTS idx_treatment_types_name;

-- Remove unused patient_phones indexes
DROP INDEX IF EXISTS idx_patient_phones_primary;
DROP INDEX IF EXISTS idx_patient_phones_phone_efficient;

-- Remove unused prescriptions indexes
DROP INDEX IF EXISTS idx_prescriptions_prescribed_date;

-- Remove unused prescription_history indexes
DROP INDEX IF EXISTS idx_prescription_history_action_date;

-- Remove unused dental_charts indexes
DROP INDEX IF EXISTS idx_dental_charts_clinic_id;
DROP INDEX IF EXISTS idx_dental_charts_patient_phone;
DROP INDEX IF EXISTS idx_dental_charts_images;

-- Remove unused patient_records indexes
DROP INDEX IF EXISTS idx_patient_records_clinic_id;
DROP INDEX IF EXISTS idx_patient_records_patient_phone;
DROP INDEX IF EXISTS idx_patient_records_images;

-- Remove unused lab_work_orders indexes
DROP INDEX IF EXISTS idx_lab_work_orders_status;
DROP INDEX IF EXISTS idx_lab_work_orders_ordered_date;

-- Remove unused lab_work indexes
DROP INDEX IF EXISTS idx_lab_work_status;
DROP INDEX IF EXISTS idx_lab_work_order_date;
DROP INDEX IF EXISTS idx_lab_work_expected_completion_date;

-- Remove unused system_audit_log indexes
DROP INDEX IF EXISTS idx_system_audit_log_action;
DROP INDEX IF EXISTS idx_system_audit_log_created_at;

-- Remove unused push_subscriptions indexes
DROP INDEX IF EXISTS idx_push_subscriptions_clinic_id;

-- Remove unused staff_permissions indexes
DROP INDEX IF EXISTS idx_staff_permissions_clinic_id;

-- Remove unused doctor_attributions indexes
DROP INDEX IF EXISTS idx_doctor_attributions_clinic_id;

-- Remove unused analytics_cache indexes
DROP INDEX IF EXISTS idx_analytics_cache_clinic_date;
DROP INDEX IF EXISTS idx_analytics_cache_key;
DROP INDEX IF EXISTS idx_analytics_cache_expires;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

SELECT '=== VERIFICATION ===' as section;

-- Check remaining indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname NOT LIKE 'pg_%'
ORDER BY tablename, indexname;

-- Count remaining indexes
SELECT 
    'Remaining indexes' as category,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname NOT LIKE 'pg_%';

-- =====================================================
-- 4. SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 Remaining performance warnings fixed! Database optimized for better performance.' as status;

-- 🦷 Dental Clinic System - Setup Verification
-- Run this to verify all features are properly configured

-- Check if all required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('clinics', 'appointments', 'scheduling_settings', 'disabled_slots', 'push_subscriptions') 
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clinics', 'appointments', 'scheduling_settings', 'disabled_slots', 'push_subscriptions')
ORDER BY table_name;

-- Check if all required columns exist in scheduling_settings
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('clinic_id', 'day_schedules', 'weekly_holidays', 'custom_holidays', 'show_stats_cards') 
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns 
WHERE table_name = 'scheduling_settings'
ORDER BY ordinal_position;

-- Check if all required columns exist in disabled_slots
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('clinic_id', 'date', 'start_time', 'end_time') 
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns 
WHERE table_name = 'disabled_slots'
ORDER BY ordinal_position;

-- Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('clinics', 'appointments', 'scheduling_settings', 'disabled_slots', 'push_subscriptions')
ORDER BY tablename;

-- Check if policies exist
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅ Policy exists'
    ELSE '❌ No policy'
  END as policy_status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('clinics', 'appointments', 'scheduling_settings', 'disabled_slots', 'push_subscriptions')
ORDER BY tablename, policyname;

-- Check if indexes exist
SELECT 
  indexname,
  tablename,
  CASE 
    WHEN indexname LIKE 'idx_%' THEN '✅ Index exists'
    ELSE '⚠️ Custom index'
  END as index_status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('clinics', 'appointments', 'scheduling_settings', 'disabled_slots', 'push_subscriptions')
ORDER BY tablename, indexname;

-- Check if triggers exist
SELECT 
  trigger_name,
  event_object_table,
  CASE 
    WHEN trigger_name LIKE '%updated_at%' THEN '✅ Auto-update trigger'
    ELSE '⚠️ Custom trigger'
  END as trigger_status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table IN ('clinics', 'appointments', 'scheduling_settings', 'disabled_slots', 'push_subscriptions')
ORDER BY event_object_table, trigger_name;

-- Check clinics and their settings
SELECT 
  c.name as clinic_name,
  c.slug,
  CASE WHEN ss.id IS NOT NULL THEN '✅' ELSE '❌' END as has_settings,
  CASE WHEN ss.show_stats_cards IS NOT NULL THEN '✅' ELSE '❌' END as has_stats_toggle,
  CASE WHEN ss.day_schedules IS NOT NULL THEN '✅' ELSE '❌' END as has_schedules,
  COUNT(ds.id) as disabled_slots_count,
  COUNT(a.id) as appointments_count
FROM clinics c
LEFT JOIN scheduling_settings ss ON c.id = ss.clinic_id
LEFT JOIN disabled_slots ds ON c.id = ds.clinic_id
LEFT JOIN appointments a ON c.id = a.clinic_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug, ss.id, ss.show_stats_cards, ss.day_schedules
ORDER BY c.created_at;

-- Summary
SELECT 
  'SETUP SUMMARY' as info,
  COUNT(*) as total_clinics,
  COUNT(CASE WHEN ss.id IS NOT NULL THEN 1 END) as clinics_with_settings,
  COUNT(CASE WHEN ss.show_stats_cards IS NOT NULL THEN 1 END) as clinics_with_stats_toggle,
  COUNT(CASE WHEN ds.id IS NOT NULL THEN 1 END) as clinics_with_disabled_slots,
  COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as clinics_with_appointments
FROM clinics c
LEFT JOIN scheduling_settings ss ON c.id = ss.clinic_id
LEFT JOIN disabled_slots ds ON c.id = ds.clinic_id
LEFT JOIN appointments a ON c.id = a.clinic_id
WHERE c.is_active = true;

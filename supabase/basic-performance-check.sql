-- 🦷 Basic Performance Check
-- Uses only fundamental PostgreSQL system views

-- Check if tables exist
SELECT 
  'Table existence check' as check_type,
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = t.table_name 
      AND table_schema = 'public'
    ) THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM (VALUES 
  ('appointments'),
  ('scheduling_settings'), 
  ('disabled_slots'),
  ('clinics')
) AS t(table_name);

-- Check table row counts
SELECT 
  'Table row counts' as check_type,
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_all_tables 
WHERE schemaname = 'public'
  AND tablename IN ('appointments', 'scheduling_settings', 'disabled_slots', 'clinics')
ORDER BY n_live_tup DESC;

-- Check active connections
SELECT 
  'Active connections' as metric,
  COUNT(*) as total_connections,
  COUNT(CASE WHEN application_name LIKE '%supabase%' THEN 1 END) as supabase_connections
FROM pg_stat_activity 
WHERE state = 'active';

-- Check database size
SELECT 
  'Database size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value;

-- Check current database
SELECT 
  'Current database' as metric,
  current_database() as value;

-- Simple health check
SELECT 
  'HEALTH CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_stat_all_tables 
      WHERE schemaname = 'public'
      AND tablename IN ('appointments', 'scheduling_settings', 'disabled_slots')
      AND n_dead_tup > n_live_tup * 0.5
    ) THEN '⚠️  High table bloat detected'
    ELSE '✅ Tables appear healthy'
  END as table_health,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_stat_activity 
      WHERE application_name LIKE '%supabase%' AND state = 'active'
    ) > 50 THEN '⚠️  Many Supabase connections'
    ELSE '✅ Connection count is normal'
  END as connection_health;

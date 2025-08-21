-- 🦷 Simple Performance Check
-- Works across all PostgreSQL versions

-- Check table statistics (most reliable)
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  ROUND((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0) * 100), 2) as dead_percent
FROM pg_stat_user_tables 
WHERE tablename IN ('appointments', 'scheduling_settings', 'disabled_slots')
ORDER BY n_live_tup DESC;

-- Check active connections
SELECT 
  'Active Supabase connections' as metric,
  COUNT(*) as count
FROM pg_stat_activity 
WHERE application_name LIKE '%supabase%' 
  AND state = 'active';

-- Check database size
SELECT 
  'Database size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value;

-- Check if tables exist
SELECT 
  'Table existence check' as check_type,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = tablename 
      AND table_schema = 'public'
    ) THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM (VALUES 
  ('appointments'),
  ('scheduling_settings'), 
  ('disabled_slots')
) AS t(tablename);

-- Simple health check
SELECT 
  'HEALTH CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_stat_user_tables 
      WHERE tablename IN ('appointments', 'scheduling_settings', 'disabled_slots')
      AND n_dead_tup > n_live_tup * 0.3
    ) THEN '⚠️  High table bloat - consider VACUUM'
    ELSE '✅ Tables are healthy'
  END as table_health,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_stat_activity 
      WHERE application_name LIKE '%supabase%' AND state = 'active'
    ) > 20 THEN '⚠️  Many connections - check for leaks'
    ELSE '✅ Connection count is normal'
  END as connection_health;

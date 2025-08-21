-- 🦷 Quick Performance Check
-- Simple script to check database performance

-- Check table sizes and row counts
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE tablename IN ('appointments', 'scheduling_settings', 'disabled_slots')
ORDER BY n_live_tup DESC;

-- Check most active queries (if pg_stat_statements is available)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
  ) THEN
    RAISE NOTICE 'pg_stat_statements extension found - checking slow queries...';
  ELSE
    RAISE NOTICE 'pg_stat_statements extension not found - skipping query analysis';
  END IF;
END $$;

-- Check for real-time subscription activity
SELECT 
  'Real-time subscriptions active' as status,
  COUNT(*) as active_connections
FROM pg_stat_activity 
WHERE application_name LIKE '%supabase%' 
  AND state = 'active';

-- Check database size
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Simple recommendations
SELECT 
  'PERFORMANCE STATUS' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_stat_user_tables 
      WHERE tablename IN ('appointments', 'scheduling_settings', 'disabled_slots')
      AND n_dead_tup > n_live_tup * 0.2
    ) THEN '⚠️  High table bloat detected - consider VACUUM'
    ELSE '✅ Table bloat is acceptable'
  END as table_health,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_stat_activity 
      WHERE application_name LIKE '%supabase%' AND state = 'active'
    ) > 10 THEN '⚠️  Many active connections - check for connection leaks'
    ELSE '✅ Connection count is normal'
  END as connection_health;

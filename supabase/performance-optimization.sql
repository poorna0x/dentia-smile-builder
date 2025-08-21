-- 🦷 Dental Clinic System - Performance Optimization
-- Run this to monitor and optimize database performance

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

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('appointments', 'scheduling_settings', 'disabled_slots')
ORDER BY idx_scan DESC;

-- Check for slow queries (requires pg_stat_statements extension)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%appointments%' 
   OR query LIKE '%scheduling_settings%'
   OR query LIKE '%disabled_slots%'
ORDER BY total_time DESC
LIMIT 10;

-- Check for unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
  AND tablename IN ('appointments', 'scheduling_settings', 'disabled_slots')
ORDER BY tablename;

-- Check for table bloat
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  ROUND((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0) * 100), 2) as dead_tup_percent
FROM pg_stat_user_tables 
WHERE tablename IN ('appointments', 'scheduling_settings', 'disabled_slots')
  AND n_dead_tup > 0
ORDER BY dead_tup_percent DESC;

-- Check active connections
SELECT 
  'Active Supabase connections' as metric,
  COUNT(*) as count,
  application_name
FROM pg_stat_activity 
WHERE application_name LIKE '%supabase%' 
  AND state = 'active'
GROUP BY application_name
ORDER BY count DESC;

-- Recommendations for optimization
SELECT 
  'PERFORMANCE RECOMMENDATIONS' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_stat_user_indexes WHERE idx_scan = 0) 
    THEN 'Consider removing unused indexes'
    ELSE 'No unused indexes found'
  END as unused_indexes,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_stat_user_tables WHERE n_dead_tup > n_live_tup * 0.1) 
    THEN 'Consider VACUUM to clean up dead tuples'
    ELSE 'Table bloat is acceptable'
  END as table_bloat,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_stat_statements WHERE mean_time > 100) 
    THEN 'Consider optimizing slow queries'
    ELSE 'Query performance is good'
  END as slow_queries;

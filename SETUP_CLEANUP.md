# 🗑️ Auto-Cleanup Setup Guide

## 📋 Overview
This guide explains how to set up automatic cleanup of old appointments in Supabase to manage storage usage.

## 🚀 Quick Setup

### Step 1: Run the Cleanup Function
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from `supabase/auto-cleanup.sql`
4. Click **Run**

### Step 2: Enable Monthly Cleanup (Optional)
To automatically run cleanup every month, run this in SQL Editor:

```sql
SELECT cron.schedule(
    'cleanup-appointments-monthly',
    '0 2 1 * *', -- Run at 2 AM on the 1st of every month
    'SELECT cleanup_old_appointments();'
);
```

## 📊 Cleanup Rules

The cleanup function follows these rules:

- **🗑️ Delete**: Appointments older than 2 years (any status)
- **📁 Archive**: Completed appointments older than 1 year
- **📅 Keep**: Recent appointments and cancelled appointments for 6 months

## 🔍 Monitor Storage Usage

Check your current storage usage:

```sql
SELECT * FROM get_appointment_storage_info();
```

This will show:
- Total appointments
- Storage size in MB
- Date range
- Status breakdown

## 🛑 Disable Cleanup

If you want to stop automatic cleanup:

### Option 1: Disable Cron Job
```sql
SELECT cron.unschedule('cleanup-appointments-monthly');
```

### Option 2: Remove Functions
```sql
DROP FUNCTION IF EXISTS cleanup_old_appointments();
DROP FUNCTION IF EXISTS get_appointment_storage_info();
```

### Option 3: Delete Files
- Delete `supabase/auto-cleanup.sql`
- Delete this guide file

## 🎯 Manual Cleanup

Run cleanup manually anytime:

```sql
SELECT cleanup_old_appointments();
```

## 📈 Storage Projections

| Appointments | Storage | Free Tier Usage |
|-------------|---------|----------------|
| 1,000 | ~0.3MB | 0.06% |
| 10,000 | ~3MB | 0.6% |
| 50,000 | ~15MB | 3% |

**💡 Recommendation**: Keep all appointments unless you're approaching the 500MB limit.

## 🔧 Customization

To modify cleanup rules, edit the function in `supabase/auto-cleanup.sql`:

```sql
-- Change 2 years to 1 year
WHERE created_at < NOW() - INTERVAL '1 year'

-- Change 1 year to 6 months for completed appointments
AND created_at < NOW() - INTERVAL '6 months'
```

## 🚨 Important Notes

- **Backup First**: Always backup your data before running cleanup
- **Test**: Run on a copy of your data first
- **Monitor**: Check logs after first cleanup run
- **Reversible**: Deleted data cannot be recovered

---

**📞 Need Help?** Check the Supabase logs for any errors during cleanup.

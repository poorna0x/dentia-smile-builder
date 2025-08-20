# 🧹 Data Cleanup Setup Guide

## Overview
This feature automatically removes old appointment data to keep your database clean and efficient. It removes appointments older than 10 days.

## Setup Steps

### 1. Run the Cleanup SQL Functions
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor** → **New Query**
3. Copy the entire content from `supabase/cleanup.sql`
4. Paste and click **"Run"**

### 2. What Gets Created
✅ **5 Cleanup Functions:**
- `cleanup_old_appointments()` - Removes all old cancelled/completed appointments (10+ days)
- `cleanup_old_cancelled_appointments()` - Removes only cancelled appointments (10+ days)
- `cleanup_old_completed_appointments()` - Removes only completed appointments (10+ days)
- `get_cleanup_stats()` - Shows cleanup statistics
- `manual_cleanup_appointments(days)` - Manual cleanup with custom days (default: 10)

### 3. Admin Panel Features
The admin panel now includes a **"Data Cleanup"** section with:

**📊 Statistics Dashboard:**
- Total old appointments
- Old cancelled appointments
- Old completed appointments
- Old confirmed appointments

**🔧 Cleanup Actions:**
- **Clean All Old Data** - Removes all old cancelled/completed appointments
- **Clean Cancelled Only** - Removes only cancelled appointments
- **Clean Completed Only** - Removes only completed appointments
- **Refresh Stats** - Updates the statistics

**⚠️ Safety Features:**
- Only removes appointments older than 10 days
- Only affects cancelled and completed appointments
- Confirmed appointments are preserved
- Warning message before deletion

## How It Works

### Automatic Cleanup (10 Days Rule)
- **Cancelled appointments**: Removed after 10 days
- **Completed appointments**: Removed after 10 days
- **Confirmed appointments**: Never automatically removed
- **Rescheduled appointments**: Never automatically removed

### Manual Cleanup
- Admin can trigger cleanup anytime
- Shows statistics before cleanup
- Confirmation messages after cleanup
- Refreshes appointment list automatically

## Usage Examples

### From Admin Panel
1. Go to **Admin Panel** → **Data Cleanup** section
2. View current statistics
3. Click **"Clean All Old Data"** to remove old appointments
4. See confirmation message with count of removed appointments

### From Supabase SQL Editor
```sql
-- Get cleanup statistics
SELECT * FROM get_cleanup_stats();

-- Clean up all old appointments
SELECT cleanup_old_appointments();

-- Clean up only cancelled appointments
SELECT cleanup_old_cancelled_appointments();

-- Clean up only completed appointments
SELECT cleanup_old_completed_appointments();

-- Manual cleanup (custom days)
SELECT manual_cleanup_appointments(14); -- Remove data older than 14 days
```

## Safety Notes

✅ **Safe Operations:**
- Only removes data older than 10 days
- Only affects cancelled/completed appointments
- Confirmed appointments are never deleted
- Admin confirmation required

⚠️ **Important:**
- This action is **permanent** and cannot be undone
- Always review statistics before cleanup
- Consider backing up data before first cleanup

## Benefits

🎯 **Database Performance:**
- Reduces database size
- Improves query performance
- Keeps admin panel fast

📱 **User Experience:**
- Cleaner admin interface
- Faster loading times
- Better organization

💰 **Cost Efficiency:**
- Reduces Supabase storage usage
- Optimizes free tier usage
- Prevents unnecessary data accumulation

## Troubleshooting

### If cleanup doesn't work:
1. Check if SQL functions were created successfully
2. Verify you're connected to the correct Supabase project
3. Check browser console for errors
4. Ensure admin is logged in

### If statistics don't show:
1. Refresh the admin page
2. Click "Refresh Stats" button
3. Check if there are any old appointments to clean

---

**✅ Setup Complete!** Your dental clinic system now has automatic data cleanup functionality.

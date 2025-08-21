# 🦷 Setting Up New Clinics

This guide explains how to add new clinics to your dental clinic system. All features will work automatically for new clinics.

## 🚀 **Quick Setup (Recommended)**

### **Step 1: Run the Main Schema**
1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste the contents of `supabase/schema.sql`**
3. **Run the script**

This creates:
- ✅ All necessary tables (`clinics`, `appointments`, `scheduling_settings`, `disabled_slots`, `push_subscriptions`)
- ✅ Default clinic: "Jeshna Dental Clinic"
- ✅ All indexes and triggers
- ✅ Row Level Security (RLS) policies
- ✅ All features ready to use

### **Step 2: Add Sample Clinics (Optional)**
1. **Copy and paste the contents of `scripts/setup-database.sql`**
2. **Run the script**

This adds:
- ✅ Smile Dental Care (Mumbai)
- ✅ Pearl Dental Studio (Delhi)
- ✅ All with proper scheduling settings

## 🎯 **Manual Clinic Setup**

### **Step 1: Create Clinic**
```sql
INSERT INTO clinics (name, slug, contact_phone, contact_email, address) 
VALUES (
  'Your Clinic Name',
  'your-clinic-slug',
  '9876543210',
  'your@email.com',
  'Your Address'
);
```

### **Step 2: Add Scheduling Settings**
```sql
INSERT INTO scheduling_settings (clinic_id, day_schedules, notification_settings, show_stats_cards) 
SELECT 
  c.id,
  '{
    "0": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": false},
    "1": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "2": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "3": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "4": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "5": {"start_time": "09:00", "end_time": "20:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": true},
    "6": {"start_time": "09:00", "end_time": "18:00", "break_start": ["13:00"], "break_end": ["14:00"], "slot_interval_minutes": 30, "enabled": false}
  }',
  '{"email_notifications": true, "reminder_hours": 24, "auto_confirm": true}',
  true
FROM clinics c 
WHERE c.slug = 'your-clinic-slug';
```

## ✅ **Features That Work Automatically**

### **Core Features:**
- ✅ **Appointment Booking** - Public booking page
- ✅ **Admin Dashboard** - Manage appointments and settings
- ✅ **Multiple Breaks** - Configure multiple break periods per day
- ✅ **Disabled Time Slots** - Temporarily disable specific slots
- ✅ **Stats Cards Toggle** - Show/hide statistics
- ✅ **Auto-Save Settings** - Changes saved automatically
- ✅ **Real-time Updates** - Live appointment updates
- ✅ **PWA Support** - Push notifications

### **Settings Features:**
- ✅ **Working Hours** - Set different schedules for each day
- ✅ **Weekly Holidays** - Mark specific days as closed
- ✅ **Custom Holidays** - Add specific dates as holidays
- ✅ **Break Periods** - Multiple breaks per day
- ✅ **Slot Intervals** - Customizable appointment duration
- ✅ **Global Disable** - Temporarily stop all bookings

### **Admin Features:**
- ✅ **Appointment Management** - Create, edit, complete, cancel
- ✅ **WhatsApp Integration** - Send messages to patients
- ✅ **Bulk Operations** - Manage multiple appointments
- ✅ **Search & Filter** - Find appointments easily
- ✅ **Tomorrow Button** - Quick access to tomorrow's appointments

## 🔧 **Verification**

After setup, verify everything works:

### **Check Database:**
```sql
-- Verify clinic exists
SELECT * FROM clinics WHERE slug = 'your-clinic-slug';

-- Verify settings exist
SELECT c.name, ss.show_stats_cards, ss.day_schedules 
FROM clinics c 
LEFT JOIN scheduling_settings ss ON c.id = ss.clinic_id 
WHERE c.slug = 'your-clinic-slug';
```

### **Test Features:**
1. **Public Booking:** `https://yoursite.com/appointment?clinic=your-clinic-slug`
2. **Admin Panel:** `https://yoursite.com/admin?clinic=your-clinic-slug`
3. **Add disabled slots** in admin settings
4. **Toggle stats cards** in admin settings
5. **Test appointment booking** and management

## 🎯 **URL Structure**

- **Public Booking:** `/appointment?clinic=clinic-slug`
- **Admin Panel:** `/admin?clinic=clinic-slug`
- **Direct Access:** `/clinic-slug` (if domain routing is set up)

## 🚨 **Important Notes**

- ✅ **No code changes needed** - All features work automatically
- ✅ **Multi-tenant ready** - Each clinic has separate data
- ✅ **Scalable** - Add unlimited clinics
- ✅ **Secure** - Row Level Security prevents data mixing
- ✅ **Performance optimized** - Caching and indexing included

## 🆘 **Troubleshooting**

### **Clinic not found:**
- Check if clinic slug is correct
- Verify clinic is active (`is_active = true`)
- Check if clinic exists in database

### **Settings not working:**
- Verify `scheduling_settings` record exists
- Check if `clinic_id` matches
- Ensure all required fields are present

### **Features not working:**
- Run the main schema script first
- Check if all tables exist
- Verify RLS policies are enabled

---

**That's it!** New clinics will have all features working automatically. No additional setup required. 🎉

-- 🦷 Multi-Tenant Dental Clinic System - Database Setup Script
-- Run this in your Supabase SQL Editor

-- First, run the main schema
-- (Copy and paste the contents of supabase/schema.sql here)

-- Then run these additional inserts for sample clinics:

-- Insert Smile Dental Care
INSERT INTO clinics (name, slug, contact_phone, contact_email, address) 
VALUES (
  'Smile Dental Care',
  'smile-dental',
  '9876543210',
  'poorn8105@gmail.com',
  'Mumbai, Maharashtra'
) ON CONFLICT (slug) DO NOTHING;

-- Insert Pearl Dental Studio
INSERT INTO clinics (name, slug, contact_phone, contact_email, address) 
VALUES (
  'Pearl Dental Studio',
  'pearl-dental',
  '8765432109',
  'poorn8105@gmail.com',
  'Delhi, NCR'
) ON CONFLICT (slug) DO NOTHING;

-- Insert scheduling settings for Smile Dental
INSERT INTO scheduling_settings (clinic_id, day_schedules, notification_settings) 
SELECT 
  c.id,
  '{
    "0": {"start_time": "09:00", "end_time": "16:00", "break_start": "13:00", "break_end": "14:00", "slot_interval_minutes": 30, "enabled": false},
    "1": {"start_time": "08:00", "end_time": "19:00", "break_start": "13:00", "break_end": "14:00", "slot_interval_minutes": 30, "enabled": true},
    "2": {"start_time": "08:00", "end_time": "19:00", "break_start": "13:00", "break_end": "14:00", "slot_interval_minutes": 30, "enabled": true},
    "3": {"start_time": "08:00", "end_time": "19:00", "break_start": "13:00", "break_end": "14:00", "slot_interval_minutes": 30, "enabled": true},
    "4": {"start_time": "08:00", "end_time": "19:00", "break_start": "13:00", "break_end": "14:00", "slot_interval_minutes": 30, "enabled": true},
    "5": {"start_time": "08:00", "end_time": "17:00", "break_start": "13:00", "break_end": "14:00", "slot_interval_minutes": 30, "enabled": true},
    "6": {"start_time": "09:00", "end_time": "16:00", "break_start": "13:00", "break_end": "14:00", "slot_interval_minutes": 30, "enabled": false}
  }',
  '{"email_notifications": true, "reminder_hours": 48, "auto_confirm": false}'
FROM clinics c 
WHERE c.slug = 'smile-dental'
ON CONFLICT (clinic_id) DO NOTHING;

-- Insert scheduling settings for Pearl Dental
INSERT INTO scheduling_settings (clinic_id, day_schedules, notification_settings) 
SELECT 
  c.id,
  '{
    "0": {"start_time": "11:00", "end_time": "18:00", "break_start": "14:00", "break_end": "15:00", "slot_interval_minutes": 30, "enabled": true},
    "1": {"start_time": "10:00", "end_time": "21:00", "break_start": "14:00", "break_end": "15:00", "slot_interval_minutes": 30, "enabled": true},
    "2": {"start_time": "10:00", "end_time": "21:00", "break_start": "14:00", "break_end": "15:00", "slot_interval_minutes": 30, "enabled": true},
    "3": {"start_time": "10:00", "end_time": "21:00", "break_start": "14:00", "break_end": "15:00", "slot_interval_minutes": 30, "enabled": true},
    "4": {"start_time": "10:00", "end_time": "21:00", "break_start": "14:00", "break_end": "15:00", "slot_interval_minutes": 30, "enabled": true},
    "5": {"start_time": "10:00", "end_time": "20:00", "break_start": "14:00", "break_end": "15:00", "slot_interval_minutes": 30, "enabled": true},
    "6": {"start_time": "11:00", "end_time": "18:00", "break_start": "14:00", "break_end": "15:00", "slot_interval_minutes": 30, "enabled": true}
  }',
  '{"email_notifications": true, "reminder_hours": 12, "auto_confirm": true}'
FROM clinics c 
WHERE c.slug = 'pearl-dental'
ON CONFLICT (clinic_id) DO NOTHING;

-- Verify the setup
SELECT 
  c.name,
  c.slug,
  c.contact_phone,
  c.contact_email,
  CASE WHEN ss.id IS NOT NULL THEN '✅' ELSE '❌' END as settings_configured
FROM clinics c
LEFT JOIN scheduling_settings ss ON c.id = ss.clinic_id
ORDER BY c.created_at;

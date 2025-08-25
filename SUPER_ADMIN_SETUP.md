# 🚀 Super Admin System Setup Guide

## Overview

The Super Admin system provides complete control over the dental clinic application with environment-based authentication and feature toggles.

## 🔐 Environment Variable Setup

### Required Environment Variable

Add this to your `.env.local` file:

```bash
VITE_SUPER_ADMIN_PASSWORD=your_super_secret_password_here
```

**⚠️ Security Requirements:**
- Use a strong password (at least 12 characters)
- Include uppercase, lowercase, numbers, and special characters
- Never commit this password to version control
- Change it regularly

### Example Strong Password:
```bash
VITE_SUPER_ADMIN_PASSWORD=M9yk84dh
```

## 🗄️ Database Setup

### 1. Run the Super Admin Schema

Execute the SQL file in your Supabase SQL editor:

```sql
-- Run the contents of supabase/super-admin-system.sql
```

This creates:
- `system_settings` table for feature toggles
- `system_audit_log` table for tracking changes
- Database functions for managing features
- Default feature configurations

### 2. Verify Setup

Check that the tables were created:

```sql
SELECT * FROM system_settings;
SELECT * FROM system_audit_log LIMIT 5;
```

## 🎯 Accessing Super Admin

### URL
```
https://your-domain.com/super-admin
```

### Authentication
1. Enter the password from `VITE_SUPER_ADMIN_PASSWORD`
2. Click "Access Super Admin"
3. Session persists until logout or browser close

## 🎛️ Available Controls

### Emergency Controls
- **Website Shutdown**: Instantly disable the entire website
- **Emergency Shutdown Button**: One-click complete shutdown

### Feature Toggles
- **Website Access**: Enable/disable entire website
- **Patient Management**: Show/hide patient portal
- **Appointment Booking**: Enable/disable public booking
- **Admin Panel**: Control admin access
- **Realtime Updates**: Toggle real-time features
- **Email Notifications**: Enable/disable email sending
- **Payment System**: Control payment processing

### System Monitoring
- **Database Connection**: Real-time status
- **Realtime Updates**: Connection status
- **Email Service**: API key validation
- **Last Backup**: System backup tracking

## 🔧 Integration with Application

### Using Feature Toggles in Components

```typescript
import { useWebsiteEnabled, usePatientManagementEnabled } from '@/hooks/useFeatureToggles';

const MyComponent = () => {
  const websiteEnabled = useWebsiteEnabled();
  const patientManagementEnabled = usePatientManagementEnabled();

  if (!websiteEnabled) {
    return <WebsiteDisabled />;
  }

  return (
    <div>
      {patientManagementEnabled && <PatientPortal />}
      {/* Rest of component */}
    </div>
  );
};
```

### Conditional Rendering

```typescript
import { useFeatureToggles } from '@/hooks/useFeatureToggles';

const AdminPanel = () => {
  const { isFeatureEnabled } = useFeatureToggles();

  if (!isFeatureEnabled('adminPanelEnabled')) {
    return <div>Admin panel is currently disabled</div>;
  }

  return <AdminContent />;
};
```

## 🛡️ Security Features

### Authentication
- Environment-based password protection
- Session-based authentication
- Automatic logout on browser close
- No persistent storage of credentials

### Audit Logging
- All feature toggle changes are logged
- Tracks who made changes and when
- Stores old and new values
- IP address and user agent tracking

### Access Control
- Only accessible via specific URL
- No public links or navigation
- Environment variable required
- Database-level security policies

## 🚨 Emergency Procedures

### Complete Website Shutdown
1. Go to `/super-admin`
2. Enter super admin password
3. Click "Emergency Shutdown" button
4. Website becomes inaccessible to all users

### Re-enabling Website
1. Go to `/super-admin` (if you have the password)
2. Toggle "Website Access" back to enabled
3. Website becomes accessible again

### Alternative Re-enabling
If you can't access super admin:
1. Update database directly:
```sql
UPDATE system_settings 
SET settings = jsonb_set(settings, '{websiteEnabled}', 'true')
WHERE setting_type = 'feature_toggle';
```

## 📊 Monitoring and Logs

### Viewing Audit Logs
```sql
SELECT 
  action,
  entity_type,
  old_values,
  new_values,
  user_id,
  created_at
FROM system_audit_log
ORDER BY created_at DESC
LIMIT 50;
```

### System Status Check
```sql
SELECT * FROM get_system_status();
```

### Feature Toggle Status
```sql
SELECT * FROM feature_toggles;
```

## 🔄 Feature Toggle Functions

### Database Functions Available

```sql
-- Get all feature toggles
SELECT get_feature_toggles();

-- Check if specific feature is enabled
SELECT is_feature_enabled('websiteEnabled');

-- Update a feature toggle
SELECT update_feature_toggle('websiteEnabled', false, 'super_admin_user');
```

## 🎨 Customization

### Adding New Feature Toggles

1. **Update the interface** in `src/hooks/useFeatureToggles.ts`:
```typescript
interface FeatureToggles {
  // ... existing features
  newFeatureEnabled: boolean;
}
```

2. **Add to default features**:
```typescript
const defaultFeatures: FeatureToggles = {
  // ... existing features
  newFeatureEnabled: true,
};
```

3. **Create convenience hook**:
```typescript
export const useNewFeatureEnabled = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  return isFeatureEnabled('newFeatureEnabled');
};
```

4. **Update database**:
```sql
UPDATE system_settings 
SET settings = jsonb_set(settings, '{newFeatureEnabled}', 'true')
WHERE setting_type = 'feature_toggle';
```

### Custom Emergency Messages

Update the emergency controls settings:

```sql
UPDATE system_settings 
SET settings = jsonb_set(settings, '{emergencyMessage}', '"Custom emergency message here"')
WHERE setting_type = 'emergency_controls';
```

## 🚀 Deployment Checklist

- [ ] Set `VITE_SUPER_ADMIN_PASSWORD` in environment variables
- [ ] Run `supabase/super-admin-system.sql` in database
- [ ] Test super admin access at `/super-admin`
- [ ] Verify feature toggles work in application
- [ ] Test emergency shutdown functionality
- [ ] Check audit logging is working
- [ ] Verify security policies are in place

## 🔍 Troubleshooting

### Common Issues

**1. Super Admin Password Not Working**
- Check `VITE_SUPER_ADMIN_PASSWORD` is set correctly
- Ensure no extra spaces or characters
- Restart development server after adding environment variable

**2. Feature Toggles Not Working**
- Verify database schema is installed
- Check `system_settings` table exists
- Ensure RLS policies are configured

**3. Audit Logging Not Working**
- Check `system_audit_log` table exists
- Verify `log_system_change` function is created
- Check database permissions

**4. Emergency Shutdown Not Working**
- Verify `websiteEnabled` toggle in database
- Check application is using feature toggles
- Ensure `WebsiteDisabled` component is imported

### Debug Commands

```sql
-- Check if super admin system is set up
SELECT COUNT(*) FROM system_settings WHERE setting_type = 'feature_toggle';

-- Check current feature toggles
SELECT settings FROM system_settings WHERE setting_type = 'feature_toggle';

-- Check recent audit logs
SELECT * FROM system_audit_log ORDER BY created_at DESC LIMIT 10;
```

## 📞 Support

If you encounter issues:
1. Check the audit logs for errors
2. Verify environment variables are set
3. Ensure database schema is properly installed
4. Test with default feature toggles

---

**⚠️ Security Reminder**: Keep your super admin password secure and never share it. This password gives complete control over your application!

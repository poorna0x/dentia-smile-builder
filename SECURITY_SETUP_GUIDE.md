# 🔒 Security Setup Guide - Fix Supabase Security Warnings

## 🚨 Current Security Issues

Your Supabase project has two security warnings that need to be addressed:

1. **Leaked Password Protection Disabled** - Not checking against HaveIBeenPwned.org
2. **Insufficient MFA Options** - Too few multi-factor authentication methods enabled

## ✅ Solution Overview

This guide will help you:
- Enable password security features
- Configure MFA options
- Set up additional security measures
- Monitor security events

## 🛠️ Step-by-Step Security Setup

### Step 1: Enable Password Security in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **Settings**

2. **Enable Password Security Features**
   - ✅ **Enable "Check passwords against HaveIBeenPwned.org"**
   - ✅ **Set minimum password length** to 8 characters
   - ✅ **Enable password strength requirements**

3. **Configure Password Policy**
   ```
   Minimum Length: 8 characters
   Require Uppercase: Yes
   Require Lowercase: Yes
   Require Numbers: Yes
   Require Special Characters: Yes
   ```

### Step 2: Enable Multi-Factor Authentication (MFA)

1. **In Supabase Dashboard**
   - Go to **Authentication** → **Settings**
   - Scroll to **Multi-Factor Authentication**

2. **Enable MFA Methods**
   - ✅ **Enable TOTP (Time-based One-Time Password)**
   - ✅ **Enable SMS (if you have SMS service configured)**
   - ✅ **Enable Email (if available)**

3. **Configure MFA Settings**
   ```
   TOTP: Enabled
   SMS: Enabled (requires SMS provider)
   Email: Enabled (if available)
   Backup Codes: Enabled
   ```

### Step 3: Run Security Enhancement Script

1. **Execute the SQL Script**
   - Go to **SQL Editor** in Supabase Dashboard
   - Copy and paste `supabase/security-enhancements.sql`
   - Run the script

2. **What This Script Does**
   - Creates password strength validation function
   - Sets up security audit logging
   - Configures login attempt tracking
   - Creates security monitoring functions

### Step 4: Configure Additional Security Settings

#### A. Session Management
```sql
-- Set session timeout to 8 hours (480 minutes)
UPDATE system_settings 
SET settings = settings || '{"session_timeout_minutes": 480}'::jsonb
WHERE setting_type = 'security_config';
```

#### B. Rate Limiting
```sql
-- Set maximum login attempts to 5
UPDATE system_settings 
SET settings = settings || '{"max_login_attempts": 5}'::jsonb
WHERE setting_type = 'security_config';
```

#### C. Account Lockout
```sql
-- Set lockout duration to 30 minutes
UPDATE system_settings 
SET settings = settings || '{"lockout_duration_minutes": 30}'::jsonb
WHERE setting_type = 'security_config';
```

### Step 5: Update Your Application Code

#### A. Enhanced Login Component

Update your `UnifiedLogin.tsx` to include password strength validation:

```typescript
// Add password strength validation
const validatePassword = (password: string) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: {
      length: password.length < minLength,
      uppercase: !hasUpperCase,
      lowercase: !hasLowerCase,
      numbers: !hasNumbers,
      special: !hasSpecialChar
    }
  };
};
```

#### B. Security Monitoring

Add security event logging to your authentication context:

```typescript
// In AuthContext.tsx
const login = async (email: string, password: string) => {
  try {
    // Log login attempt
    await supabase.rpc('log_security_event', {
      event_type: 'LOGIN_ATTEMPT',
      user_email: email,
      details: { ip_address: 'client_ip' }
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failed login
      await supabase.rpc('log_security_event', {
        event_type: 'LOGIN_FAILED',
        user_email: email,
        details: { error: error.message }
      });
      return { success: false, error: error.message };
    }

    // Log successful login
    await supabase.rpc('log_security_event', {
      event_type: 'LOGIN_SUCCESS',
      user_email: email,
      details: { user_id: data.user?.id }
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
```

### Step 6: Test Security Features

#### A. Test Password Strength
1. Try creating a user with weak password
2. Should be rejected with specific error messages
3. Try creating user with strong password
4. Should be accepted

#### B. Test MFA Setup
1. Enable MFA for your admin account
2. Test TOTP authentication
3. Test backup codes (if enabled)

#### C. Test Security Logging
1. Check security audit log after login attempts
2. Verify login attempt tracking
3. Test account lockout after multiple failed attempts

## 🔍 Security Monitoring

### View Security Logs

```sql
-- View recent security events
SELECT 
  event_type,
  user_email,
  ip_address,
  created_at,
  details
FROM security_audit_log
ORDER BY created_at DESC
LIMIT 50;

-- View failed login attempts
SELECT 
  email,
  ip_address,
  attempt_time,
  user_agent
FROM login_attempts
WHERE success = FALSE
ORDER BY attempt_time DESC
LIMIT 20;
```

### Security Dashboard Queries

```sql
-- Failed login attempts by IP
SELECT 
  ip_address,
  COUNT(*) as failed_attempts,
  MAX(attempt_time) as last_attempt
FROM login_attempts
WHERE success = FALSE
  AND attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY failed_attempts DESC;

-- Users with most failed attempts
SELECT 
  email,
  COUNT(*) as failed_attempts,
  MAX(attempt_time) as last_attempt
FROM login_attempts
WHERE success = FALSE
  AND attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY email
ORDER BY failed_attempts DESC;
```

## 🚨 Security Best Practices

### 1. Password Policy
- ✅ Minimum 8 characters
- ✅ Mix of uppercase, lowercase, numbers, special characters
- ✅ Check against known breached passwords
- ✅ Regular password rotation

### 2. Multi-Factor Authentication
- ✅ Enable TOTP for all admin accounts
- ✅ Use SMS as backup (if available)
- ✅ Generate backup codes
- ✅ Require MFA for sensitive operations

### 3. Session Management
- ✅ Set reasonable session timeouts
- ✅ Implement automatic logout
- ✅ Track session activity
- ✅ Log security events

### 4. Access Control
- ✅ Implement rate limiting
- ✅ Account lockout after failed attempts
- ✅ IP-based restrictions (if needed)
- ✅ Regular access reviews

## ✅ Success Indicators

You'll know the security setup is working when:

1. ✅ **Password warnings resolved** in Supabase Dashboard
2. ✅ **MFA options enabled** and functional
3. ✅ **Weak passwords rejected** with specific error messages
4. ✅ **Security events logged** in audit table
5. ✅ **Failed login attempts tracked** and limited
6. ✅ **Account lockout working** after multiple failures

## 🔧 Troubleshooting

### Common Issues

1. **MFA not working**
   - Check if SMS provider is configured
   - Verify TOTP app setup
   - Test backup codes

2. **Password validation errors**
   - Check password policy settings
   - Verify HaveIBeenPwned integration
   - Test with various password strengths

3. **Security logs not appearing**
   - Check RLS policies
   - Verify function permissions
   - Test manual log insertion

### Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Verify environment variables
3. Test with simple examples
4. Check browser console for errors

---

**🔒 Your Supabase project is now secured with enhanced password protection and MFA!**

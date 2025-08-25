# 🔐 Unified Authentication System Setup

## Overview

This system provides **single login authentication** for both admin and patient management areas with **persistent sessions** until manual logout.

## ✨ Features

- **Single Login**: One login form for both admin and patient management
- **Persistent Sessions**: Stays logged in until manual logout
- **Automatic Redirects**: Redirects to intended page after login
- **Secure Logout**: Proper session cleanup on logout
- **User Profile**: Shows logged-in user information

## 🛠️ How It Works

### 1. **Protected Routes**
- `/admin` - Admin dashboard (requires login)
- `/admin/patients` - Patient management (requires login)
- `/patient/dashboard` - Patient dashboard (requires login)

### 2. **Login Flow**
- User tries to access protected route
- If not logged in → redirected to `/login`
- After successful login → redirected to intended page
- Session persists across browser tabs/windows

### 3. **Logout Flow**
- Click logout button in any protected page
- Session cleared and redirected to home page
- Must login again to access protected areas

## 📋 Setup Instructions

### 1. **Create Supabase User**

You need to create a user in Supabase Authentication:

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"**
4. Enter:
   - **Email**: `admin@yourclinic.com` (or your preferred email)
   - **Password**: Choose a strong password
5. Click **"Create User"**

### 2. **Test the System**

1. **Try accessing protected routes**:
   - Go to `localhost:3000/admin` → Should redirect to login
   - Go to `localhost:3000/admin/patients` → Should redirect to login

2. **Login**:
   - Use the email and password you created
   - Should redirect to the intended page

3. **Test persistence**:
   - Close and reopen browser
   - Go to protected route → Should still be logged in

4. **Test logout**:
   - Click logout button → Should redirect to home
   - Try accessing protected route → Should redirect to login

## 🔧 Configuration

### Environment Variables

Make sure your `.env.local` has:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Permissions

The system uses Supabase Row Level Security (RLS). Make sure your tables have appropriate policies for authenticated users.

## 🎯 Usage Examples

### Direct Access to Protected Routes

- `localhost:3000/admin` → Login required
- `localhost:3000/admin/patients` → Login required  
- `localhost:3000/patient/dashboard` → Login required

### Login with Redirect

- `localhost:3000/login?redirect=/admin/patients` → Login then go to patient management
- `localhost:3000/login?redirect=/admin` → Login then go to admin dashboard

## 🔒 Security Features

- **Session Management**: Uses Supabase Auth sessions
- **Automatic Redirects**: Prevents unauthorized access
- **Secure Logout**: Proper session cleanup
- **Persistent Sessions**: No need to login repeatedly

## 🚨 Troubleshooting

### "Login Failed" Error
- Check if user exists in Supabase Authentication
- Verify email/password are correct
- Check browser console for errors

### "Redirect Loop" Issue
- Clear browser cache and cookies
- Check if login route is working properly

### Session Not Persisting
- Check Supabase configuration
- Verify environment variables are correct

## 📱 User Interface

### Login Page (`/login`)
- Clean, modern design
- Email and password fields
- Show/hide password toggle
- Error handling and loading states

### Logout Button
- Available in all protected pages
- Shows user email
- Dropdown menu with logout option
- Confirms logout action

## 🔄 Migration from Old System

The old separate login systems are still available for backward compatibility:
- `/admin/login` - Old admin login
- `/patient/login` - Old patient login

But the new unified system is recommended for better user experience.

## ✅ Success Indicators

You'll know the system is working when:

1. ✅ Accessing `/admin` redirects to login if not authenticated
2. ✅ Login works with Supabase credentials
3. ✅ After login, you can access all protected routes
4. ✅ Session persists across browser restarts
5. ✅ Logout properly clears session and redirects to home
6. ✅ Logout button shows user information

---

**🎉 Your unified authentication system is now ready!**

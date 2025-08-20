# Supabase Setup Guide for Dental Clinic Application

## 🚀 **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `dentia-smile-builder` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (usually 2-3 minutes)

## 🔑 **Step 2: Get API Credentials**

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 📝 **Step 3: Set Environment Variables**

1. Create a `.env.local` file in your project root:
```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace the placeholder values with your actual Supabase credentials

## 🗄️ **Step 4: Set Up Database Schema**

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste it into the SQL editor and click "Run"
4. This will create:
   - `appointments` table
   - `scheduling_settings` table
   - Indexes for performance
   - Triggers for automatic timestamps
   - Row Level Security policies
   - Default scheduling settings

## 🔧 **Step 5: Enable Real-time Features**

1. In your Supabase dashboard, go to **Database** → **Replication**
2. Enable real-time for both tables:
   - `appointments`
   - `scheduling_settings`

## 📧 **Step 6: Set Up Email Service (Optional)**

For email notifications, you can use Supabase's built-in email service:

1. Go to **Settings** → **Auth** → **Email Templates**
2. Configure email templates for:
   - Appointment confirmation
   - Appointment cancellation
   - Appointment rescheduling
   - Appointment completion

## 🔒 **Step 7: Configure Row Level Security (Optional)**

The current setup allows all operations. For production, you should:

1. Go to **Authentication** → **Policies**
2. Review and modify the policies based on your security requirements
3. Consider adding user authentication if needed

## 🧪 **Step 8: Test the Setup**

1. Start your development server:
```bash
npm run dev
```

2. Test the following features:
   - Creating appointments (should appear in real-time)
   - Updating appointments
   - Deleting appointments
   - Managing scheduling settings
   - Real-time updates across multiple browser tabs

## 📊 **Step 9: Monitor Usage**

1. Go to **Dashboard** → **Usage** to monitor:
   - Database queries
   - Real-time connections
   - Storage usage
   - API requests

## 🚨 **Troubleshooting**

### Common Issues:

1. **Environment Variables Not Found**
   - Make sure `.env.local` is in the project root
   - Restart your development server after adding environment variables

2. **Real-time Not Working**
   - Check if real-time is enabled in Supabase dashboard
   - Verify your internet connection
   - Check browser console for errors

3. **Database Connection Errors**
   - Verify your Supabase URL and API key
   - Check if your project is active
   - Ensure the database schema is properly set up

4. **CORS Errors**
   - Go to **Settings** → **API** → **CORS**
   - Add your localhost URL: `http://localhost:5173`

## 🔄 **Next Steps**

After setup, you can:

1. **Customize Email Templates**: Set up branded email notifications
2. **Add Authentication**: Implement user login for admin access
3. **Set Up Backups**: Configure automatic database backups
4. **Monitor Performance**: Use Supabase Analytics to optimize queries
5. **Deploy**: Deploy your application with the production Supabase project

## 📚 **Additional Resources**

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 **Support**

If you encounter issues:
1. Check the [Supabase Status Page](https://status.supabase.com)
2. Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
3. Review the [Troubleshooting Guide](https://supabase.com/docs/guides/troubleshooting)

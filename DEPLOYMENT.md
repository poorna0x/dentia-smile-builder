# 🚀 Netlify Deployment Guide

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: Set up Supabase environment variables

## Step 1: Environment Variables Setup

### In Netlify Dashboard:
1. Go to Site Settings → Environment Variables
2. Add the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Get Supabase Credentials:
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy the "Project URL" and "anon public" key

## Step 2: Deploy to Netlify

### Option A: Deploy from Git (Recommended)
1. **Connect Repository**:
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Choose your GitHub repository
   - Select the branch (usually `main` or `master`)

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18` (or higher)

3. **Deploy**:
   - Click "Deploy site"
   - Wait for build to complete

### Option B: Manual Deploy
1. **Build Locally**:
   ```bash
   npm run build
   ```

2. **Upload to Netlify**:
   - Go to Netlify Dashboard
   - Drag and drop the `dist` folder
   - Site will be deployed automatically

## Step 3: Configure Custom Domain (Optional)

1. **Add Domain**:
   - Go to Site Settings → Domain management
   - Add your custom domain
   - Follow DNS configuration instructions

2. **HTTPS**:
   - Netlify automatically provides SSL certificates
   - No additional configuration needed

## Step 4: Verify PWA Installation

### Test PWA Features:
1. **Visit your deployed site**
2. **Check PWA Installation**:
   - Desktop: Look for install icon in browser address bar
   - Mobile: Use browser menu to "Add to Home Screen"
   - Admin Panel: Go to Settings → Mobile App Installation

### Verify Service Worker:
1. Open Developer Tools (F12)
2. Go to Application → Service Workers
3. Should see service worker registered and active

## Step 5: Database Setup

### Enable Realtime in Supabase:
1. Go to Supabase Dashboard
2. Database → Replication
3. Enable realtime for these tables:
   - `appointments`
   - `scheduling_settings`
   - `disabled_slots`

### Verify Database Connection:
1. Visit your deployed site
2. Go to Admin panel
3. Check if appointments load correctly
4. Test real-time updates

## Troubleshooting

### Build Errors:
- Check Node.js version (use 18+)
- Verify all dependencies are installed
- Check environment variables are set correctly

### PWA Not Working:
- Ensure HTTPS is enabled (automatic on Netlify)
- Check manifest.webmanifest is accessible
- Verify service worker is registered

### Database Connection Issues:
- Verify Supabase URL and key are correct
- Check if Supabase project is active
- Ensure realtime is enabled for required tables

## Performance Optimization

### Enable Netlify Features:
1. **Asset Optimization**:
   - Go to Site Settings → Build & Deploy → Post Processing
   - Enable "Asset optimization"

2. **Caching**:
   - Netlify automatically caches static assets
   - Service worker provides additional caching

3. **CDN**:
   - Netlify provides global CDN automatically
   - No additional configuration needed

## Monitoring

### Netlify Analytics:
1. Go to Site Settings → Analytics
2. Enable analytics to monitor:
   - Page views
   - Performance metrics
   - Error rates

### Supabase Monitoring:
1. Go to Supabase Dashboard
2. Monitor:
   - Database performance
   - API usage
   - Realtime connections

## Security

### Environment Variables:
- Never commit sensitive keys to Git
- Use Netlify environment variables
- Rotate keys regularly

### CORS Configuration:
- Supabase handles CORS automatically
- No additional configuration needed for Netlify

## Support

### Common Issues:
1. **Build Fails**: Check Node version and dependencies
2. **PWA Not Installing**: Verify HTTPS and manifest
3. **Database Errors**: Check environment variables
4. **Realtime Not Working**: Enable realtime in Supabase

### Resources:
- [Netlify Documentation](https://docs.netlify.com)
- [Supabase Documentation](https://supabase.com/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps)

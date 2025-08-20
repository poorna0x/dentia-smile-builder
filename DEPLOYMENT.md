# 🚀 Netlify Deployment Guide

## Prerequisites
- Netlify account
- Supabase project set up
- Git repository with your code

## Step 1: Prepare Your Environment Variables

### In Netlify Dashboard:
1. Go to your site settings
2. Navigate to "Environment variables"
3. Add the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=your_secure_password
```

### Get Supabase Credentials:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and "anon public" key

## Step 2: Deploy to Netlify

### Option A: Deploy from Git (Recommended)
1. Connect your GitHub/GitLab repository to Netlify
2. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`
3. Deploy!

### Option B: Manual Deploy
1. Run `npm run build` locally
2. Drag the `dist` folder to Netlify

## Step 3: Configure Custom Domain (Optional)
1. Go to Domain settings in Netlify
2. Add your custom domain
3. Configure DNS settings

## Step 4: Verify Deployment
- ✅ Home page loads correctly
- ✅ Navigation works
- ✅ Appointment booking works
- ✅ Admin panel accessible
- ✅ Supabase connection working

## Troubleshooting

### Common Issues:
1. **Environment variables not working**: Check Netlify environment variables
2. **Build fails**: Check Node version (should be 18+)
3. **Routing issues**: Ensure `_redirects` file is in `public/` folder
4. **Safari issues**: Fixed with CSS optimizations

### Build Commands:
```bash
# Local build test
npm run build

# Preview build
npm run preview

# Check for issues
npm run lint
```

## Security Notes
- Never commit `.env` files to Git
- Use strong admin passwords
- Regularly update dependencies
- Monitor Supabase usage

## Performance Tips
- Images are optimized for web
- CSS is minified automatically
- JavaScript is bundled and minified
- Static assets are cached

## Support
If you encounter issues:
1. Check Netlify build logs
2. Verify environment variables
3. Test locally with `npm run build`
4. Check browser console for errors

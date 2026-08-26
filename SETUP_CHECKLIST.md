# Setup Checklist

## ✅ Pre-Deployment Checklist

### 1. Verify Files Exist
- [ ] `.env.example` exists
- [ ] `supabase/migrations/001_initial_schema.sql` exists
- [ ] `middleware.ts` exists
- [ ] `README.md` updated
- [ ] All app routes created (24 routes)
- [ ] All components created

### 2. Supabase Setup
- [ ] Create Supabase account
- [ ] Create new project
- [ ] Copy project URL
- [ ] Copy anon key
- [ ] Copy service role key
- [ ] Run migration SQL in SQL Editor
- [ ] Verify `profiles` table exists
- [ ] Verify RLS is enabled
- [ ] Test profile creation trigger

### 3. Local Development
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in Supabase credentials
- [ ] Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Visit http://localhost:3000
- [ ] Verify landing page loads

### 4. Test Authentication
- [ ] Register new account at `/auth/register`
- [ ] Check email for verification link
- [ ] Verify account
- [ ] Login at `/auth/login`
- [ ] Verify redirect to `/dashboard`
- [ ] Test logout

### 5. Test Profile
- [ ] Navigate to `/dashboard/profile`
- [ ] Update full name
- [ ] Save changes
- [ ] Verify success message

### 6. Grant Admin Access
- [ ] Open Supabase dashboard
- [ ] Go to Table Editor → profiles
- [ ] Find your user
- [ ] Change `role` from `Staff` to `Admin`
- [ ] Refresh dashboard
- [ ] Verify "Admin Panel" appears in sidebar

### 7. Test Admin Panel
- [ ] Click "Admin Panel" in sidebar
- [ ] Verify redirect to `/admin`
- [ ] Verify dashboard shows user statistics
- [ ] Navigate to "Users" page
- [ ] Verify user table displays
- [ ] Create second test user
- [ ] Change second user's role
- [ ] Verify role update works

### 8. Test Security
- [ ] Log out
- [ ] Try accessing `/dashboard` (should redirect to login)
- [ ] Try accessing `/admin` (should redirect to login)
- [ ] Login as Staff user
- [ ] Try accessing `/admin` (should redirect to dashboard)

### 9. Vercel Deployment
- [ ] Push code to GitHub
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Add environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_APP_URL` (your Vercel domain)
- [ ] Deploy
- [ ] Wait for build to complete
- [ ] Visit production URL
- [ ] Test registration
- [ ] Test login

### 10. Production Verification
- [ ] Landing page loads correctly
- [ ] Navigation works
- [ ] Registration works
- [ ] Email verification works
- [ ] Login works
- [ ] Dashboard accessible
- [ ] Profile update works
- [ ] Admin panel accessible (for admins)
- [ ] User management works
- [ ] Logout works

## 🚨 Common Issues

### Build Fails
- Check all environment variables are set
- Verify Supabase credentials are correct
- Check for TypeScript errors: `npm run build`

### Login Doesn't Work
- Verify email is confirmed in Supabase Auth dashboard
- Check Supabase project is not paused
- Verify anon key is correct

### Admin Panel Not Accessible
- Check user role in Supabase profiles table
- Verify RLS policies are active
- Check middleware is running

### Session Issues
- Clear browser cookies
- Check `NEXT_PUBLIC_APP_URL` matches your domain
- Verify Supabase Auth is configured correctly

## 📞 Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Check Vercel deployment logs
4. Verify all environment variables
5. Ensure database migration ran successfully

---

**Ready to deploy? Start with step 1!**

# Supabase Setup Guide for AgentPay Economy

This guide will help you set up Supabase as the production database for your AgentPay Economy app.

## Why Supabase?

- **Free Tier**: 500MB database, 50K monthly active users
- **Hosted & Managed**: No DevOps needed
- **Built-in Auth**: Easy authentication (we can migrate to it later)
- **Real-time**: WebSocket support for live updates
- **Auto-generated APIs**: RESTful API from your schema
- **Easy Deployment**: Just environment variables

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: `agentpay-economy` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect for demo/MVP

## Step 2: Run Database Schema

1. In your Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `backend/supabase_setup.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)

You should see: ✅ Success. No rows returned

This means all tables, indexes, and sample data were created!

## Step 3: Get Your Credentials

1. In Supabase dashboard, click "Settings" (left sidebar)
2. Click "API"
3. Copy these values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long token)

## Step 4: Configure Backend

1. In `flux-economy/backend/`, create a `.env` file:

```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and update:

```env
USE_SUPABASE=true
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
SECRET_KEY=your-random-secret-key
```

3. Generate a secret key (optional):

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Step 5: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 6: Update Your Start Script

Replace the old `api.py` with the new Supabase-compatible version:

```bash
cd backend
mv api.py api_old.py
mv api_supabase.py api.py
```

Or update your start script to use `api_supabase.py`:

```bash
# In start-backend.sh
python3 backend/api_supabase.py
```

## Step 7: Test Connection

```bash
cd backend
python3 api_supabase.py
```

You should see:
```
🚀 Using Supabase database
✅ Connected to Supabase at https://xxxxx.supabase.co
 * Running on http://0.0.0.0:5001
```

## Step 8: Test Authentication

1. Start the backend (if not already running)
2. Start the frontend:
   ```bash
   cd flux-economy
   npm run dev
   ```
3. Open browser to `http://localhost:3000`
4. You should see the hero page
5. Click "Sign In"
6. Use demo credentials:
   - Username: `user`
   - Password: `welcome`
7. You should be redirected to the dashboard!

## Verify Data in Supabase

1. Go to Supabase dashboard
2. Click "Table Editor" (left sidebar)
3. You should see tables:
   - `users` (1 demo user)
   - `agents` (10 sample agents)
   - `transactions` (empty for now)
   - `api_keys`

## Development vs Production

### For Development (SQLite)
```env
USE_SUPABASE=false
```

### For Production (Supabase)
```env
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## Deployment

When deploying to production (Vercel, Railway, Render, etc.):

1. Set environment variables in your hosting platform
2. Make sure `USE_SUPABASE=true`
3. Add your `SUPABASE_URL` and `SUPABASE_KEY`

## Row Level Security (RLS)

The setup script enables RLS with permissive policies. For production, you should:

1. Update policies to be more restrictive
2. Use Supabase Auth for user authentication
3. Add user-specific access controls

Example policy:
```sql
-- Only allow users to see their own agents
CREATE POLICY "Users can only view own agents"
ON agents FOR SELECT
USING (auth.uid()::text = user_id);
```

## Next Steps

1. ✅ Database is set up
2. ✅ Authentication works
3. ✅ Dashboard displays data
4. 🚀 Ready to demo!

### Future Enhancements:
- Migrate to Supabase Auth (replace current session-based auth)
- Add real-time subscriptions for live transaction updates
- Implement proper RLS policies
- Add user registration flow
- Deploy to production (Vercel + Supabase)

## Troubleshooting

### Connection Error
- Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Make sure you're using the **anon/public** key, not the service role key
- Verify your project is active in Supabase dashboard

### No Data Showing
- Run the SQL setup script again
- Check "Table Editor" in Supabase to verify data exists
- Check browser console for API errors

### Authentication Not Working
- Verify demo user was created (check `users` table)
- Password for demo user is `welcome`
- Username is `user`

## Cost Estimation

**Free Tier Limits:**
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users

**For MVP/Demo:** Free tier is perfect!

**When to upgrade:** If you exceed these limits or need:
- More storage
- Daily backups
- Custom domain
- Better support

**Pro Tier:** $25/month - includes 8 GB database, 100 GB bandwidth

---

Need help? Check [Supabase Docs](https://supabase.com/docs) or file an issue!

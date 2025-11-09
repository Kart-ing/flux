# Quick Start Guide - AgentPay Economy

Get your demo up and running in 5 minutes!

## Option 1: Quick Demo (SQLite - No Setup Needed)

**Use this for immediate testing with zero configuration.**

```bash
# 1. Start the backend
cd flux-economy
./start-backend.sh
# Or: python3 backend/api.py

# 2. In a new terminal, start the frontend
cd flux-economy
npm run dev

# 3. Open browser
open http://localhost:3000

# 4. Login with demo credentials
Username: user
Password: welcome
```

That's it! You now have:
- ✅ Hero landing page
- ✅ Login page
- ✅ Full dashboard with sample data
- ✅ 10 demo agents (spenders + earners)
- ✅ Real-time transaction tracking

## Option 2: Production Setup (Supabase - 10 Minutes)

**Use this for a demo-able, shareable app that others can access.**

### Step 1: Create Supabase Project (3 min)

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Click "New Project"
3. Name: `agentpay-economy`
4. Set a database password (save it!)
5. Choose region → Create project (wait ~2 min)

### Step 2: Setup Database (2 min)

1. In Supabase dashboard → Click "SQL Editor"
2. Open `backend/supabase_setup.sql` in your code editor
3. Copy entire file → Paste in SQL Editor
4. Click "Run" → ✅ Success!

### Step 3: Get Credentials (1 min)

1. Supabase dashboard → Settings → API
2. Copy:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long token)

### Step 4: Configure App (2 min)

```bash
# Create .env file
cd flux-economy/backend
cp .env.example .env

# Edit .env (use your values from Step 3)
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
SECRET_KEY=any-random-string-here
```

### Step 5: Install Dependencies (1 min)

```bash
cd flux-economy/backend
pip install -r requirements.txt
```

### Step 6: Update API File (1 min)

```bash
cd flux-economy/backend
# Rename files
mv api.py api_sqlite.py
mv api_supabase.py api.py
```

### Step 7: Run! (same as Option 1)

```bash
# Terminal 1: Backend
cd flux-economy
python3 backend/api.py

# Terminal 2: Frontend
cd flux-economy
npm run dev

# Browser
open http://localhost:3000
```

Login: `user` / `welcome`

## What You Get

### Landing Page (Hero)
- Beautiful gradient design
- Feature showcase
- Call-to-action buttons
- Stats display

### Dashboard
- Real-time economy metrics
- Top spenders/earners
- Transaction history
- Agent management
- Beautiful charts & visualizations

### Navigation
- Dashboard
- Billing
- API Keys
- Documentation
- Settings

## File Structure

```
flux-economy/
├── app/
│   ├── page.tsx           # Main page (shows hero or redirects)
│   ├── hero/page.tsx      # Landing page
│   ├── login/page.tsx     # Login page
│   ├── dashboard/         # Main dashboard
│   ├── billing/
│   ├── api-keys/
│   ├── docs/
│   └── settings/
├── backend/
│   ├── api.py             # Flask API (current: SQLite or Supabase)
│   ├── database.py        # SQLite database
│   ├── database_supabase.py  # Supabase database
│   ├── supabase_setup.sql    # SQL schema for Supabase
│   └── .env               # Environment config
├── components/            # React components
└── SUPABASE_SETUP.md     # Detailed Supabase guide
```

## Demo Flow

1. **Unauthenticated** → Beautiful hero page
2. **Click "Get Started"** → Login page
3. **Login** → Dashboard with live data
4. **Explore** → Agents, transactions, charts

## Deployment Options

### Free Tier Options:

1. **Vercel (Frontend)** + **Railway (Backend)** + **Supabase (DB)**
   - All free tiers
   - ~15 min setup
   - Custom domain

2. **Render (Fullstack)** + **Supabase (DB)**
   - Free tier
   - Simpler but slower

3. **Fly.io** + **Supabase**
   - Good free tier
   - Better performance

### Recommended for Demo:
**Vercel + Supabase** (easiest, fastest, most reliable)

## Next Steps After Demo

1. **Add Your Data**: Replace sample agents with real ones
2. **Customize Branding**: Update colors, logo, name
3. **Add Features**:
   - User registration
   - API key management
   - Billing integration
   - Real-time updates (Supabase Realtime)
4. **Deploy**: Push to production with one of the options above

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python3 --version  # Need 3.8+

# Install dependencies
cd backend
pip install flask flask-cors
```

### Frontend won't start
```bash
# Check Node version
node --version  # Need 16+

# Install dependencies
npm install

# Clear cache
rm -rf .next
npm run build
npm run dev
```

### Can't login
- Username: `user` (lowercase)
- Password: `welcome` (lowercase)
- Check browser console for errors
- Make sure backend is running on port 5001

### No data showing
- SQLite: Run `python3 backend/database.py` to reseed
- Supabase: Re-run the SQL setup script

## Support

- **Detailed Supabase Setup**: See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Issues**: Create a GitHub issue
- **Questions**: Check the code comments

---

**Ready to impress?** Start with Option 1 for instant demo, then migrate to Option 2 when you're ready to share! 🚀

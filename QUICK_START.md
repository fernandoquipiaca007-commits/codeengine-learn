# AI Knowledge Store Platform - Quick Start Guide

## 🚀 Getting Started

This guide will get your AI Knowledge Store Platform up and running in 30 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Stripe account (for payments)
- An email service account (Resend, SendGrid, etc.)

## Step 1: Supabase Setup (10 minutes)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in details and wait for provisioning (~2 minutes)
4. Get your credentials from **Project Settings → API**:
   - Project URL
   - anon/public key
   - service_role key (keep secret!)

### 1.2 Configure Environment Variables

Update these files with your Supabase credentials:

**`.env.store`** (Store Frontend)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**`admin/.env.admin`** (Admin Dashboard)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**`backend/.env.backend`** (Backend Service)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 1.3 Execute Database Setup

1. Open Supabase SQL Editor
2. Copy contents of `supabase/complete-setup.sql`
3. Paste and run
4. Verify: You should see 8 tables, 3 triggers, and 25+ policies created

**✅ Checkpoint**: Run this query to verify:
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```
Should return: 8

## Step 2: Storage Setup (5 minutes)

### 2.1 Create Storage Buckets

In Supabase Dashboard → Storage, create these buckets:

1. **product-covers** (Public, 5MB, images)
2. **product-previews** (Public, 10MB, images/PDFs)
3. **product-videos** (Public, 100MB, videos)
4. **ebooks-private** (Private, 500MB, documents)

See `supabase/storage-setup.md` for detailed instructions.

**✅ Checkpoint**: You should see 4 buckets in Storage section

## Step 3: Install Dependencies (5 minutes)

### Store Frontend
```bash
npm install
```

### Admin Dashboard
```bash
cd admin
npm install
cd ..
```

### Backend Service
```bash
cd backend
npm install
cd ..
```

## Step 4: Run Development Servers (2 minutes)

### Terminal 1: Store Frontend
```bash
npm run dev
```
Opens at: http://localhost:5173

### Terminal 2: Admin Dashboard
```bash
cd admin
npm run dev
```
Opens at: http://localhost:5174

### Terminal 3: Backend Service
```bash
cd backend
npm run dev
```
Runs at: http://localhost:3001

## Step 5: Test the Setup (5 minutes)

### Test 1: Admin Dashboard

1. Open http://localhost:5174
2. Sign up with email/password
3. Try creating a category:
   - Name: "E-books"
   - Description: "Digital books and guides"
   - Display Order: 1

**✅ Checkpoint**: Category should appear in the list

### Test 2: Store Frontend

1. Open http://localhost:5173
2. You should see the home page
3. Navigate to Library page
4. Categories should be visible (if any created)

**✅ Checkpoint**: No errors in browser console

### Test 3: Database Connection

Run this in Supabase SQL Editor:
```sql
SELECT * FROM categories;
```

**✅ Checkpoint**: Should show the category you created

## Common Issues

### Issue: "Invalid API key"
- **Solution**: Double-check your environment variables
- Make sure you copied the correct keys from Supabase
- Restart dev servers after updating .env files

### Issue: "Table does not exist"
- **Solution**: Run `supabase/complete-setup.sql` in SQL Editor
- Verify tables created: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`

### Issue: "Permission denied"
- **Solution**: Check RLS policies are created
- Verify you're using the correct key (anon for frontend, service role for backend)
- Run `supabase/rls-policies.sql` if policies are missing

### Issue: "Cannot connect to Supabase"
- **Solution**: Check your Supabase project is active
- Verify URL format: `https://your-project-id.supabase.co`
- Check network connection

## Next Steps

Now that your setup is complete:

### 1. Configure Stripe (for payments)
- Get API keys from [stripe.com](https://stripe.com)
- Update `.env.store` with publishable key
- Update `backend/.env.backend` with secret key
- Set up webhook endpoint

### 2. Configure Email Service
- Choose provider (Resend recommended)
- Get API key
- Update `backend/.env.backend`

### 3. Start Building
- **Admin Dashboard**: Create products, categories, coupons
- **Store Frontend**: Browse products, test checkout flow
- **Backend Service**: Process webhooks, send emails

## Project Structure

```
.
├── src/                    # Store Frontend (React)
│   ├── components/         # UI components
│   ├── pages/              # Page components
│   └── lib/                # Utilities
├── admin/                  # Admin Dashboard (React)
│   ├── components/         # Admin UI components
│   ├── pages/              # Admin pages
│   └── lib/                # Admin utilities
├── backend/                # Backend Service (Node.js)
│   ├── src/                # Source code
│   │   ├── webhooks/       # Webhook handlers
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── tests/              # Tests
└── supabase/               # Database scripts
    ├── schema.sql          # Database schema
    ├── triggers.sql        # Triggers & functions
    └── rls-policies.sql    # Security policies
```

## Documentation

- **Setup Guide**: `SUPABASE_SETUP.md`
- **Database Setup**: `supabase/README.md`
- **Storage Setup**: `supabase/storage-setup.md`
- **Task 1 Summary**: `supabase/TASK1_COMPLETION_SUMMARY.md`
- **Design Document**: `.kiro/specs/ai-knowledge-store-platform/design.md`
- **Requirements**: `.kiro/specs/ai-knowledge-store-platform/requirements.md`
- **Tasks**: `.kiro/specs/ai-knowledge-store-platform/tasks.md`

## Support

Need help?
1. Check the documentation files above
2. Review Supabase docs: https://supabase.com/docs
3. Check Stripe docs: https://stripe.com/docs
4. Review the design document for architecture details

## Development Workflow

1. **Make changes** in your code editor
2. **Test locally** using dev servers
3. **Verify in Supabase** dashboard (data, storage, logs)
4. **Commit changes** to version control
5. **Deploy** when ready (Vercel, Netlify, etc.)

---

**Status**: ✅ Task 1 Complete - Database and environment setup done!

**Next**: Task 2 - Storage buckets setup (see `supabase/storage-setup.md`)

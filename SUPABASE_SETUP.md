# Supabase Project Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Project Name**: AI Knowledge Store
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Start with Free tier
4. Click "Create new project" and wait for provisioning (2-3 minutes)

## Step 2: Get Your Supabase Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy the following credentials:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: Used for frontend clients (Store & Admin)
   - **service_role key**: Used for backend service (keep this secret!)

## Step 3: Configure Environment Variables

### Store Frontend (.env.store)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here
VITE_APP_URL=http://localhost:5173
```

### Admin Dashboard (admin/.env.admin)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VITE_APP_URL=http://localhost:5174
```

### Backend Service (backend/.env.backend)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
STRIPE_SECRET_KEY=your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret-here
EMAIL_SERVICE_API_KEY=your-email-service-api-key-here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
PORT=3001
NODE_ENV=development
```

## Step 4: Execute Database Schema

The database schema will be created in the next steps using the SQL script from the design document.

## Step 5: Configure Stripe (for later)

1. Go to [https://stripe.com](https://stripe.com) and create an account
2. Get your API keys from the Developers section
3. Set up webhook endpoint pointing to your backend service
4. Update the environment variables with your Stripe keys

## Step 6: Configure Email Service (for later)

Choose an email service provider:
- **Resend** (recommended): [https://resend.com](https://resend.com)
- **SendGrid**: [https://sendgrid.com](https://sendgrid.com)
- **Mailgun**: [https://mailgun.com](https://mailgun.com)

Get your API key and update the backend environment variables.

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env.*` files to version control
- Keep your `service_role` key secret - it bypasses Row Level Security
- Use the `anon` key for frontend applications
- Rotate keys if they are ever exposed

## Next Steps

After completing this setup:
1. Run the database schema creation script (Task 1.2)
2. Create database triggers and functions (Task 1.3)
3. Configure Row Level Security policies (Task 1.4)
4. Set up Storage buckets (Task 2)

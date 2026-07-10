# Vercel Environment Variables Setup for deadandtattooed.com

## Overview

This guide explains how to configure environment variables in Vercel for your production domain (deadandtattooed.com).

## Required Environment Variables

### 1. Better Auth Configuration

- **BETTER_AUTH_SECRET**: A secure random string (generate with `openssl rand -base64 32`)
- **BETTER_AUTH_URL**: Your production domain URL
  - **Production**: `https://deadandtattooed.com`
  - **Preview**: Leave empty or use preview URL (Vercel auto-generates)

### 2. Stripe Configuration

- **STRIPE_SECRET_KEY**: Your Stripe secret key
  - **Production**: Use your live Stripe secret key (starts with `sk_live_`)
  - **Preview/Development**: Use test key (starts with `sk_test_`)
- **PUBLIC_STRIPE_PUBLISHABLE_KEY**: Your Stripe publishable key (public env var)
  - **Production**: Use your live Stripe publishable key (starts with `pk_live_`)
  - **Preview/Development**: Use test key (starts with `pk_test_`)

### 3. Cloudflare R2 Configuration

- **R2_ACCOUNT_ID**: Your Cloudflare R2 account ID
- **R2_ACCESS_KEY_ID**: R2 access key ID
- **R2_SECRET_ACCESS_KEY**: R2 secret access key
- **R2_BUCKET_NAME**: R2 bucket name (default: `dead-and-tattooed`)

### 4. Database Configuration

- **DATABASE_URL**: PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Use your production database URL
- **DATABASE_SSL**: Set to `true` for production (required for most cloud databases)

## How to Configure in Vercel

### Step 1: Access Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**

### Step 2: Add Variables for Production

For each variable, click **Add** and configure:

1. **Key**: Enter the variable name (e.g., `BETTER_AUTH_URL`)
2. **Value**: Enter the production value
3. **Environment**: Select **Production** (and optionally **Preview** and **Development**)

### Step 3: Domain-Specific Configuration

#### For Production (deadandtattooed.com):

```
BETTER_AUTH_URL=https://deadandtattooed.com
BETTER_AUTH_SECRET=<your-production-secret>
STRIPE_SECRET_KEY=<your-live-stripe-key>
PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-live-stripe-publishable-key>
DATABASE_URL=<your-production-database-url>
DATABASE_SSL=true
R2_ACCOUNT_ID=<your-r2-account-id>
R2_ACCESS_KEY_ID=<your-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret-key>
R2_BUCKET_NAME=dead-and-tattooed
```

#### For Preview/Development:

- Use test/development values
- `BETTER_AUTH_URL` can be left empty (defaults to localhost) or use preview URL
- Use Stripe test keys
- Use development database

### Step 4: Environment-Specific Values

Vercel allows you to set different values for:

- **Production**: Used when deployed to your production domain
- **Preview**: Used for preview deployments (PR previews)
- **Development**: Used for `vercel dev` command

**Recommendation**: Set production-specific values only for Production environment, and use test/development values for Preview and Development.

## Important Notes

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **BETTER_AUTH_SECRET**: Must be the same across all environments for the same auth system, or different if you want separate auth systems
3. **DATABASE_SSL**: Should be `true` for production databases (Vercel Postgres, Neon, Supabase, etc.)
4. **After adding variables**: You need to redeploy for changes to take effect

## Verification

After setting up variables:

1. Redeploy your application
2. Check Vercel deployment logs for any missing environment variable errors
3. Test authentication, Stripe, and R2 uploads in production

## Security Best Practices

- ✅ Use strong, randomly generated secrets
- ✅ Use different Stripe keys for production vs. development
- ✅ Never expose secrets in client-side code
- ✅ Rotate secrets periodically
- ✅ Use Vercel's environment variable encryption

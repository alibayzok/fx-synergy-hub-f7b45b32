

# Fix: Email Confirmation Redirect Issue

## Problem
When a new user signs up and clicks "Confirm your mail" in the email, they get redirected to `http://localhost:3000` which shows an `access_denied` / `otp_expired` error. The link should redirect to the actual published app URL.

## Root Cause
Two things need to be fixed:

1. **Supabase Auth Site URL** is currently set to `http://localhost:3000`. This controls where confirmation emails redirect users.
2. **signUp code** in `src/hooks/useAuth.tsx` uses `window.location.origin` for `emailRedirectTo`, which sends the preview URL instead of the production URL.

## Solution

### Step 1: Update Supabase Auth Site URL
Use the configure-auth tool to set the Site URL to `https://fx-synergy-hub.lovable.app` and add redirect URLs for both the published URL and the Vercel deployment (`https://assassinfx.vercel.app`).

### Step 2: Update signUp redirect in useAuth.tsx
Change line 151 in `src/hooks/useAuth.tsx`:

**Before:**
```typescript
emailRedirectTo: window.location.origin,
```

**After:**
```typescript
emailRedirectTo: APP_URLS.production,
```

This uses the centralized production URL (`https://assassinfx.vercel.app`) from the environment config, ensuring the confirmation email always points to the correct URL regardless of where the user signed up from.

## Technical Details

### Files to modify:
- `src/hooks/useAuth.tsx` - Change `emailRedirectTo` from `window.location.origin` to `APP_URLS.production` (import already exists for `AUTH_CONFIG`, just need to also import `APP_URLS`)

### Auth configuration changes:
- Site URL: `https://fx-synergy-hub.lovable.app`
- Additional redirect URLs: `https://assassinfx.vercel.app`, `https://fx-synergy-hub.lovable.app`


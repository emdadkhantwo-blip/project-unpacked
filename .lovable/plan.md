

# Fix Superadmin Login - Disable Email Confirmation for Testing

## Problem

The superadmin account **exists** in the database (signup was successful), but login fails because email confirmation is **enabled by default**. The error from the backend is `email_not_confirmed`.

## Solution

Disable email confirmation in the auth settings so that new signups (including the existing superadmin) can log in immediately. Additionally, create a secure backend-only edge function that can confirm and auto-login the superadmin account for testing purposes.

---

## Implementation Steps

### Step 1: Disable Email Confirmation in Auth Settings

Use the configure-auth tool to disable the "Confirm email" requirement. This allows users to sign in immediately after signup without clicking a confirmation link.

- This is a backend configuration change
- Affects all new signups going forward
- The existing superadmin@gmail.com account will be able to log in once confirmed

### Step 2: Confirm the Existing Superadmin Account via Migration

Since the account already exists but is unconfirmed, run a migration to manually confirm the email for `superadmin@gmail.com`.

```sql
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'superadmin@gmail.com'
  AND email_confirmed_at IS NULL;
```

### Step 3: Create Backend-Only Edge Function for Future Use

Create a secure edge function `confirm-superadmin` that can be called to confirm and prepare the superadmin account. This helper will:

- Only work for the specific superadmin email
- Require the service role key (not callable from browser)
- Log the action for audit purposes

Location: `supabase/functions/confirm-superadmin/index.ts`

---

## Technical Details

### Auth Configuration Change

```text
Enable email confirmations: false
```

This means new users can sign in immediately after signup. For production, you may want to re-enable this later.

### Edge Function: confirm-superadmin

```typescript
// Only confirms superadmin@gmail.com
// Requires service role key authentication
// Returns success/failure status
```

### Migration to Confirm Existing Account

The migration will update the `email_confirmed_at` timestamp for the superadmin account, allowing immediate login.

---

## After Implementation

Once complete, you will be able to:

1. Go to `/auth`
2. Sign in with `superadmin@gmail.com` / `beehotel2026`
3. Be redirected to `/admin/tenants` (the superadmin dashboard)

---

## Files to Create/Modify

| File | Action |
|------|--------|
| Auth settings | Configure to disable email confirmation |
| Migration | Confirm existing superadmin email |
| `supabase/functions/confirm-superadmin/index.ts` | Create edge function |
| `supabase/config.toml` | Add function configuration |


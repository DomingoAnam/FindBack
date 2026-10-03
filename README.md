# FindBack

React Native lost-and-found app for the Dalaguete Public Market. Built with Expo, TypeScript, and Supabase.

## Run the app

```bash
npm install
npm run start
```

Use Expo Go to scan the QR code, or press `a` in the Expo terminal to open an Android emulator. iOS simulator builds require macOS.

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the project Connect panel. Do not use a service-role key in the app.
3. In the Supabase SQL Editor, run or rerun [`supabase/schema.sql`](supabase/schema.sql). It creates profiles, reports, claim requests, RLS policies, a private photo bucket, realtime publication entries, and an hourly cleanup job. If `pg_cron` is not enabled for the project, enable it under Database > Extensions before running the schema.
4. Restart Expo after setting `.env` with `npm run start -- --clear`.

The first authorized operator creates an account by selecting Admin; the form stores the credentials through Supabase Auth and the profile trigger assigns the Admin role. User signup stays disabled until that Admin account is created. The Admin option then closes and users can register with their own accounts. A database uniqueness constraint enforces the one-Admin limit, including concurrent signup attempts. Do not distribute the app publicly until the intended Admin has created this first account; the first Admin signup determines who receives Admin privileges. Admins can publish lost/found reports, review user claim requests, mark items claimed, or delete reports. Report deletion is shared immediately; claimed reports are hidden after 15 days and the scheduled job permanently deletes them. Photos are uploaded to a private Storage bucket and shown with signed URLs.

Supabase credentials belong in the ignored local `.env` file and must not be committed. If the app cannot read them or the schema is not installed, it shows the setup screen instead of allowing sign-in.

## Project structure

```text
src/
  components/       Shared role header, report card, and navigation
  lib/              Supabase client and Expo auth storage
  services/         Shared reports, photos, and claims API
  features/
    admin/            Report management and claim review
    auth/             Sign-in and User registration
    reports/          Lost/found report form
    users/            Report browsing and claim tracking
  types/             Shared report and status types
supabase/schema.sql   Database, RLS, Storage, Realtime, and expiry job
App.tsx               Session loading and role routing
```
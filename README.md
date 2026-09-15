# Al-Sami Creation's — Order & Customer Management

Workshop ke liye order aur grahak management app. Roman Urdu UI, Supabase backend, Vercel par hosted.

## Setup (local)

1. `npm install`
2. `.env.local.example` ko `.env.local` mein copy karein aur Supabase Project Settings → API se apni values bharein.
3. Supabase Dashboard → SQL Editor mein `supabase/schema.sql` ki poori file paste karke Run karein.
4. Supabase Dashboard → Authentication → Providers mein "Email" on hai, aur Authentication → Settings mein "Confirm email" off karein (taake naye staff logins turant kaam karein).
5. `npm run dev` — sab se pehle jo account signup karega wo automatically **admin** ban jayega.

## Deploy

Vercel par GitHub repo connect karein aur wahi 3 env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) Project Settings → Environment Variables mein daal dein.

## Features

- Grahak list (WhatsApp-style chat list), tafseelat, orders
- Har order: articles + sizes (XS–XL) ke hisaab se quantity, auto totals
- Pending / Partial / Closed order tabs, edit aur partial-close
- Wapsi (returns) ka alag log
- Articles inventory
- Hisaab Kitaab: date-range insights (top dresses, top customers, top returns)
- Admin-only "Users" — naye staff logins banane ke liye

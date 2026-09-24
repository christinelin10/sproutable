# Sproutable

A clickable web prototype for community gardens. Garden managers publish a home page, run events, approve members, and export a simple grant report. Neighbors join, RSVP, chat, and keep a bed journal. The interface is in English and Spanish.

This follows the GardenHub prototype brief. Gamification, payments, and a native app are intentionally not in this build. Visit check-ins, interest tags, and harvest logs are stored so a later passport can use them.

## Run it

```bash
npm install
npm run seed
npm run dev
```

Open http://localhost:3000.

Demo password for every seeded account: `gardenhub`

| Email | Who |
| --- | --- |
| manager1@demo.com | Maria, manages Riverside |
| manager2@demo.com | Sam, manages Hilltop |
| member1@demo.com | Denise, member and bed holder |
| member2@demo.com | Carlos, Spanish-speaking member |
| user1@demo.com | Priya, no garden yet |
| user2@demo.com | Luis, pending request, Spanish |
| pat@demo.com | Pat, removed from Riverside chat |
| admin@demo.com | Avery, can toggle the verified badge |

`npm run seed` rewrites `data/db.json` and refreshes dates around today.

## Stack

- Next.js App Router, TypeScript, Tailwind
- English and Spanish through `next-intl` (cookie, not a locale in the URL)
- Email and password sessions in an httpOnly cookie
- Local JSON datastore behind `src/lib/data/store.ts`

The app never talks to Google Sheets directly. A spreadsheet adapter can replace `readDb` / `updateDb` later. The demo uses JSON so it runs without API keys and without spreadsheet rate limits.

## What you can click through

- Sign up as a neighbor or a manager, or log in with a demo account
- Browse gardens and open a modular home page
- Switch EN / ES from any page
- Request to join, then approve or decline as the manager
- Create recurring events, RSVP from the calendar, cancel one date
- Inbox, public chat with delete and chat removal
- Beds, journal photos, announcements, check-in
- Impact charts plus PDF and CSV export

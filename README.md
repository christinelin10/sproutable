# Sproutable

A clickable web prototype for community gardens. Garden managers publish a home page, run events, approve members, and export a simple grant report. Neighbors join, RSVP, chat, and keep a bed journal. The interface is in English and Spanish.

This follows the GardenHub prototype brief. Payments and a native app are intentionally not in this build. Visit check-ins, interest tags, and harvest logs feed a cooperative gardener: the home page is a small garden world, and real visits, gatherings, journal notes, photos, and harvests add experience.

## Garden world

Open `/` to walk the garden. The signpost is the map, the bulletin is the event board, a bed is what's growing, and the badge board is achievements. `/gardener` shows level and collected badges. `+ Journal` stays on every page and opens `/journal` for a bed you already hold. The map, event board, Beechview board, and milestone achievements are the same tools as before, with this layer around them.

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

## What's growing

`/growing` is the Beechview board: beds, journal notes, item donations, and money pledges. A pledge is a note for the steward. The app does not charge a card.

Log in as `beechview@demo.com` to ask for an item or mark one as here. Any demo account can offer an item or record a pledge. Password: `gardenhub`.

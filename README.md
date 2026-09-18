# Sproutable

Community gardens, events, volunteering, and visit-based gamification — on the web first, with a path to mobile.

This repository is an early base. The product idea is settled enough to start; the implementation stack is **proposed, not locked**.

## What we are building

Two sides of the same product:

**Garden organizers**
- Publish and manage events
- Post announcements
- Own a garden’s public page
- Accept donations

**Visitors / volunteers**
- Discover gardens and events
- Apply to volunteering roles
- Check in / visit gardens
- Earn progress from frequency and activity (visits, volunteer hours, event attendance)

The bar is high for **accessibility** (keyboard, screen readers, contrast, reduced motion) and for looking good on **phone browsers and desktop**.

## Stack recommendation (please confirm)

**Start with Next.js (App Router) + TypeScript + Tailwind.**

This product is a content, forms, and dashboard app: garden pages, event listings, volunteer applications, announcements, and donations. That is a web-native shape. Accessibility and SEO (people should be able to find a garden and an event) are also stronger on the web than in a native-only app.

**Mobile, without splitting the team yet**
1. Ship a responsive, accessible website that feels excellent on a phone.
2. Add a PWA (home-screen install, offline-ish visit history) when the core flows work.
3. Only then consider Expo / React Native if we need App Store listing, camera-based check-in, or push that the web cannot do well.

**Data and payments (next, after the UI shell)**
- Postgres (Supabase or a managed Postgres) for gardens, events, roles, visits, points
- Auth later (email magic link is enough for v1)
- Stripe Checkout for donations

### Why not Expo-first?

Expo is the right call if the *primary* experience is a native app (camera check-ins, maps, push, offline). Organizer tools — tables, event editors, donation reports — fight React Native. We would likely still need a web dashboard.

### Why not a separate backend (Rails, Django, Nest) first?

We can add a dedicated API later. For a small team, Next.js route handlers plus Postgres get organizers and visitors onto one codebase faster. If we later need a native app, the API can be extracted.

### Why not Flutter?

One codebase for iOS/Android/web is appealing, but Flutter web accessibility and content-site SEO are weaker than Next.js. This product needs to be a public website as much as an “app.”

## Proposed app map (not built yet)

| Path | Who | Purpose |
| --- | --- | --- |
| `/` | Everyone | Discover gardens and nearby events |
| `/gardens/[slug]` | Everyone | Garden home: story, hours, announcements, donate |
| `/events` | Visitors | Browse and RSVP |
| `/volunteer` | Visitors | Open roles and applications |
| `/me` | Visitors | Visits, streaks, badges |
| `/organize` | Organizers | Events, announcements, roles, donations |

Gamification should stay **kind**: streaks and badges for showing up, not leaderboards that shame quieter volunteers.

## Repo status

GitHub: [zzzPranav/sproutable](https://github.com/zzzPranav/sproutable)

Nothing is scaffolded yet on purpose. Confirm Next.js (or choose Expo-first / a monorepo) and the next commit will be the actual app shell.

## Local

Once a framework is generated:

```bash
npm install
npm run dev
```

# Finbrief — Claude Code bootstrap guide

## Step 1: Install Claude Code

You need Node.js 18+ installed first. Then run:

```bash
# macOS / Linux / WSL
curl -fsSL claude.ai/install.sh | bash

# OR via npm
npm install -g @anthropic-ai/claude-code
```

Log in when prompted — use your Claude.ai Pro/Max account or your
Anthropic Console account (console.anthropic.com).

---

## Step 2: Create your project folder and open Claude Code

```bash
mkdir finbrief && cd finbrief
claude
```

---

## Step 3: Paste this prompt into Claude Code

Copy everything between the lines and paste it as your first message:

---

```
Build me a full-stack web app called "finbrief" — a personalised AI finance newsletter.

## What it does
Users sign up, pick the assets and industries they want to follow, and receive a
personalised daily digest written by Claude. The digest covers their specific
watchlist (stocks, ETFs, crypto, commodities, forex) plus industry/topic news.
Users can toggle between a pre-market and end-of-day view. At the end of each
digest there is a feedback section where users rate the digest, select topics
they want more of, and write free-text notes. Claude uses this feedback when
generating the next digest.

## Tech stack
- Next.js 14 (App Router) — frontend and API routes
- TypeScript throughout
- Tailwind CSS for styling
- Supabase (PostgreSQL + Auth) — user accounts, watchlists, feedback, digest history
- Finnhub API — stock/ETF/crypto/forex prices and news (free tier)
- NewsAPI — additional industry news (free tier)
- Anthropic Claude API (claude-haiku-4-5) — digest generation via Batch API
- Resend — email delivery
- Vercel — deployment

## Project structure to create

finbrief/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── onboarding/page.tsx       # 4-step onboarding flow
│   ├── digest/page.tsx           # Main digest view
│   ├── settings/page.tsx         # User settings (watchlist, frequency, topics)
│   └── api/
│       ├── digest/generate/route.ts   # POST — generate a digest for a user
│       ├── digest/send/route.ts       # POST — send digest via email (cron target)
│       ├── feedback/route.ts          # POST — save user feedback
│       ├── watchlist/route.ts         # GET/POST/DELETE — manage user watchlist
│       └── prices/route.ts            # GET — fetch live prices from Finnhub
├── components/
│   ├── DigestView.tsx            # Full digest UI (pre-market / EOD toggle)
│   ├── AssetCard.tsx             # Individual asset card (price + insight)
│   ├── NewsItem.tsx              # News story row
│   ├── MarketMood.tsx            # Sentiment bar + indicators
│   ├── FeedbackForm.tsx          # Star rating + tags + free text
│   ├── AssetSearch.tsx           # Search + add assets to watchlist
│   └── OnboardingFlow.tsx        # Multi-step onboarding
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── finnhub.ts                # Finnhub API wrapper
│   ├── newsapi.ts                # NewsAPI wrapper
│   ├── claude.ts                 # Anthropic SDK — digest generation
│   ├── resend.ts                 # Email sending
│   └── digest-builder.ts        # Assembles data + calls Claude
├── types/
│   └── index.ts                  # Shared TypeScript types
├── .env.local.example            # All required env vars listed
└── supabase/
    └── migrations/
        └── 001_init.sql          # Full DB schema

## Database schema (create in 001_init.sql)

-- Users are managed by Supabase Auth

create table profiles (
  id uuid references auth.users primary key,
  name text,
  email text,
  frequency text default 'daily',   -- 'daily' | '2x' | 'weekly'
  digest_time text default 'pre',    -- 'pre' | 'eod' | 'both'
  created_at timestamptz default now()
);

create table watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  ticker text not null,
  name text not null,
  asset_type text not null,  -- 'stock' | 'etf' | 'crypto' | 'commodity' | 'forex'
  created_at timestamptz default now()
);

create table followed_industries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  label text not null,       -- e.g. 'Tech', 'Shoe industry'
  is_custom boolean default false,
  created_at timestamptz default now()
);

create table digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  digest_type text not null,  -- 'pre' | 'eod'
  content jsonb not null,     -- full digest JSON
  sent_at timestamptz,
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  digest_id uuid references digests(id),
  stars int,                  -- 1-5
  tags text[],                -- e.g. ['Tesla', 'Macro news']
  freetext text,
  created_at timestamptz default now()
);

-- Row-level security: users can only see their own data
alter table profiles enable row level security;
alter table watchlist_items enable row level security;
alter table followed_industries enable row level security;
alter table digests enable row level security;
alter table feedback enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own watchlist" on watchlist_items for all using (auth.uid() = user_id);
create policy "own industries" on followed_industries for all using (auth.uid() = user_id);
create policy "own digests" on digests for all using (auth.uid() = user_id);
create policy "own feedback" on feedback for all using (auth.uid() = user_id);

## Digest generation logic (lib/digest-builder.ts)

The generateDigest(userId) function should:
1. Fetch the user's watchlist from Supabase
2. Fetch the user's followed industries
3. Fetch the last 3 pieces of feedback from Supabase
4. Call Finnhub to get prices and news for each asset
5. Call NewsAPI for each industry/topic
6. Build a system prompt that includes the user's name, watchlist, feedback
   history, and the raw data fetched
7. Call Claude Haiku via the Anthropic Batch API with this prompt:

System prompt template:
"""
You are a personal finance analyst writing a daily digest for {name}.

Their watchlist: {watchlist_summary}
Their followed industries: {industries}

Recent feedback they gave:
{feedback_summary}

Use this feedback to adjust tone, depth, and focus.

Write a digest with these sections:
1. AI summary (3-4 sentences, personal and specific to their holdings)
2. Per-asset insight (1-2 sentences per asset, data-driven)
3. Industry news summary (brief bullets per industry)
4. Market mood (overall sentiment, key macro numbers)

Be conversational, specific, and avoid generic market commentary.
This is NOT financial advice — add a one-line disclaimer at the end.

Current data:
{raw_data_json}
"""

Return the digest as structured JSON matching the DigestContent type.

## Environment variables needed (.env.local.example)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
FINNHUB_API_KEY=
NEWS_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=digest@finbrief.app
NEXT_PUBLIC_APP_URL=http://localhost:3000

## TypeScript types (types/index.ts)

export type AssetType = 'stock' | 'etf' | 'crypto' | 'commodity' | 'forex'

export interface WatchlistItem {
  id: string
  ticker: string
  name: string
  assetType: AssetType
}

export interface DigestContent {
  digestType: 'pre' | 'eod'
  generatedAt: string
  summary: string
  assets: AssetDigestItem[]
  news: NewsItem[]
  marketMood: MarketMood
}

export interface AssetDigestItem {
  ticker: string
  name: string
  assetType: AssetType
  price: string
  change: string
  direction: 'up' | 'down' | 'flat'
  insight: string
}

export interface NewsItem {
  headline: string
  source: string
  url: string
  publishedAt: string
  industry: string
}

export interface MarketMood {
  sentiment: string
  bullishScore: number   // 0-100
  vix: number
  sp500Change: string
  extraIndicators: Record<string, string>
}

## Free tier API notes

- Finnhub free tier: 60 calls/min, 15-20 min delay on prices. Good for MVP.
  Endpoint: https://finnhub.io/api/v1/quote?symbol=TSLA&token=API_KEY
  News: https://finnhub.io/api/v1/company-news?symbol=TSLA&from=...&to=...

- NewsAPI free tier: 100 req/day, dev only (no production deploy).
  For production use the $49/mo Business plan or switch to Finnhub news.

- Resend free tier: 3,000 emails/month, 100/day.

- Claude Haiku Batch API: 50% cheaper than standard. Perfect for newsletters
  that don't need real-time generation. Use client.beta.messages.batches.create()

## Cron job for sending digests

Create a Vercel cron job in vercel.json:
{
  "crons": [
    { "path": "/api/digest/send", "schedule": "0 7 * * 1-5" },   // 7am weekdays pre-market
    { "path": "/api/digest/send?type=eod", "schedule": "0 17 * * 1-5" }  // 5pm weekdays EOD
  ]
}

The send route fetches all users due a digest, calls generateDigest() for each,
stores in Supabase, then sends via Resend.

## Styling notes

Use Tailwind. The brand colours are:
- Primary green: #1D9E75 (actions, CTAs)
- Selection blue: #378ADD (selected state)
- Background: white / zinc-50
- Asset type accent colours:
  - Stocks: purple (#534AB7 border, #EEEDFE bg)
  - ETFs: green (#3B6D11 border, #EAF3DE bg)
  - Crypto: amber (#854F0B border, #FAEEDA bg)
  - Commodities: coral (#993C1D border, #FAECE7 bg)
  - Forex: pink (#993556 border, #FBEAF0 bg)

## Build order (do this in sequence)

1. Set up Next.js project with TypeScript and Tailwind
2. Create Supabase project, run migration, configure auth
3. Build all lib/ wrappers (supabase, finnhub, newsapi, claude, resend)
4. Build types/index.ts
5. Build digest-builder.ts (core logic)
6. Build API routes
7. Build UI components (AssetCard, NewsItem, etc.)
8. Build DigestView page
9. Build OnboardingFlow
10. Build settings page
11. Build landing page
12. Set up Vercel cron
13. Deploy to Vercel

Start with step 1. Ask me before moving to the next step.
```

---

## Free API keys you'll need to sign up for

| Service | URL | Free tier |
|---|---|---|
| Finnhub | https://finnhub.io | 60 calls/min |
| NewsAPI | https://newsapi.org | 100 req/day (dev) |
| Resend | https://resend.com | 3,000 emails/mo |
| Supabase | https://supabase.com | Free tier (500MB DB) |
| Anthropic | https://console.anthropic.com | Pay-as-you-go |

---

## Tips for working with Claude Code

- **Say "ask me before moving to the next step"** — this is already in the prompt.
  It stops Claude from charging ahead and building everything at once.
- **Review every file before approving** — Claude Code shows diffs before writing.
  Read them. Especially the Supabase migration (irreversible once run).
- **Use `/cost` to check spend** — Claude Code tracks token usage. Check it
  periodically so you don't get a surprise bill.
- **Commit after each step** — run `git init` before you start, commit after
  each major step so you can roll back.
- **Ask Claude Code to explain** — if something looks wrong, type
  "explain what this file does before we continue". It will.

---

## Estimated build time

Working with Claude Code at a steady pace:
- Core backend (lib/, API routes, DB): ~1–2 hours
- UI components + pages: ~1–2 hours
- Testing + fixing edge cases: ~1 hour
- Deploy to Vercel: ~30 minutes

**Total: a solid afternoon.**

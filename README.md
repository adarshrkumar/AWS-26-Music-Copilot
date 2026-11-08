# Music Copilot

Music Copilot is a songwriting environment that explains music theory while you write. Build a chord progression, set a key, a tempo and a bar count, and see the scales, arpeggios and guide tones that fit each chord, with the reason for every suggestion shown beside it. Tabs and sheet music stay in one place.

Copilot explains and suggests, and the songwriter decides. Nothing is written into a song without your action.

The full product spec is in [`music-copilot-spec.md`](music-copilot-spec.md), and a shorter version is in [`music-copilot-summary.md`](music-copilot-summary.md).

## Status

This repository is the starter scaffold. The theory engine, the progression editor and the tabs and sheet music editor are not built yet. It currently includes a home page, a streaming AI chat endpoint, an example posts API, the database setup and the Music Copilot design system.

## Quick Start

### Prerequisites

- Node.js 20 or newer
- PostgreSQL database (Neon or local)
- A Vercel AI Gateway API key, and optionally an Exa API key

The project folder path must not contain spaces, because some native dependencies fail to build in paths with spaces.

### Installation

```bash
npm install
cp .env.example .env
```

Then fill in your `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# BetterAuth
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:4321"

# Vercel AI Gateway (for Vercel AI SDK)
AI_GATEWAY_API_KEY="..."

# Exa Search (optional)
EXA_API_KEY="..."
```

### Database Setup

```bash
# Push schema to database
npx drizzle-kit push

# Or generate and run migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Development

```bash
npm run dev
```

Visit `http://localhost:4321`.

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview the production build
- `npm run check` - Run ESLint, stylelint, Astro type checking and a production build
- `npm run stylelint:fix` - Auto-fix SCSS lint issues
- `npm run astro` - Run Astro CLI commands

## Tech Stack

- [Astro](https://docs.astro.build) 5 with SSR, deployed with the Vercel adapter
- [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL (Neon)
- [Zod](https://zod.dev) for validation
- [Vercel AI SDK](https://ai-sdk.dev/docs) through the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Better Auth](https://www.better-auth.com/docs) (installed, not wired up yet)
- [Exa](https://docs.exa.ai) for search
- SCSS with the Music Copilot design system and [OpenProps](https://open-props.style)
- PWA support via `vite-plugin-pwa`

## Project Structure

```text
src/
├── components/
│   └── Card.astro
├── db/
│   ├── initialize.ts         # Drizzle client and database helpers
│   ├── schema.ts             # Drizzle schemas
│   └── validations.ts        # Zod validation schemas
├── layouts/
│   └── Layout.astro
├── lib/
│   ├── config.ts             # Site configuration
│   ├── content-converter.ts  # Markdown and HTML conversion
│   ├── dom-utils.ts          # Cheerio HTML helpers
│   └── exa-search.ts         # Exa search helpers
├── pages/
│   ├── api/
│   │   ├── chat.ts           # Streaming AI chat endpoint
│   │   └── posts.ts          # Example posts CRUD
│   └── index.astro           # Home page
└── styles/
    ├── variables/            # Design system, forwarded by globals.scss, plus mixins
    ├── components/           # Component styles
    ├── pages/                # Page styles
    ├── globals.scss          # Global styles
    ├── reset.scss            # CSS reset
    └── property-order.json   # Property order enforced by stylelint
```

## Styles

- No `<style>` tags in `.astro` files. Every style lives in an external SCSS file.
- Data attributes for modifiers, such as `data-variant="primary"`.
- The design system in `src/styles/variables/` follows the sheet-music style guide in [`music-copilot-design-system/style-guide.md`](music-copilot-design-system/style-guide.md).

```astro
---
import '@/styles/components/button.scss';
---
<button class="btn" data-variant="primary" data-size="large">
    Save progression
</button>
```

## AI

`src/pages/api/chat.ts` streams responses through the Vercel AI Gateway, so any gateway model string works, such as `openai/gpt-4o` or `anthropic/claude-3-5-sonnet-20241022`.

In the finished app, the theory engine is rule-based. The language model only writes explanation text from the engine's output, and never adds notes or chords to a song without the songwriter's action.

## Utilities

```typescript
import { htmlToMarkdown, markdownToHtml } from '@/lib/content-converter';
import { extractHeadings, extractLinks } from '@/lib/dom-utils';
import { searchWeb } from '@/lib/exa-search';

const markdown = htmlToMarkdown('<h1>Hello</h1>');
const html = await markdownToHtml('# Hello');
const links = extractLinks(html);
const results = await searchWeb('ii V I progression guide tones');
```

## Metrics

Usage metrics count events only. They never store chords, notes or melodies, and their ids are random values that are not linked to an account. Events are stored in the `data` table with the partition key `METRIC`, and the numbers are shown at `/app/metrics`.

| Metric | How it is measured |
| --- | --- |
| Progressions built | Sessions with a `progression_saved` event, out of sessions with a `session_start` event |
| Suggestions accepted | `suggestion_accepted` out of `suggestion_shown`, recorded by the server in `addScaleSuggestion`, `addPhraseSuggestion` and the two status functions |
| Theory checks | Devices with a `reason_opened` event, out of devices with a `session_start` event |
| Time to first scale | Median seconds from `first_chord` to `first_scale_view` within one session |

The browser tracker is `src/scripts/app/metrics.astro`, loaded by the app layout. A control reports an event with an attribute, such as `data-metric="reason_opened"`. A script reports one with `document.dispatchEvent(new CustomEvent('metric', { detail: { name: 'first_chord' } }))`. The progression and scales screens need to send `first_chord`, `progression_saved` and `first_scale_view` when they are built. Targets are placeholders until the pilot runs.

## Deployment

```bash
npm i -g vercel
vercel
```

Set these environment variables in your Vercel project settings:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `AI_GATEWAY_API_KEY`
- `EXA_API_KEY` (optional)

## License

MIT

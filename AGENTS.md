# AGENTS.md

This file provides guidance to AI Agents that are working with code in this repository.

## Project Overview

Music Copilot is a songwriting environment built with Astro that explains music theory while the user writes. The user builds a chord progression, sets a key, a tempo and a bar count, and the app shows the scales and arpeggios that fit each chord, along with guide tones that help a player move smoothly between chords. Tabs and sheet music stay in one place, and suggestions appear beside the notes the user is writing.

The core rule: Copilot explains and suggests, and the songwriter decides. Every suggestion shows the theory behind it, and nothing is written into a song without the user's action.

The first audience is music hobbyists and music students. The full product spec is in `music-copilot-spec.md`, with a shorter version in `music-copilot-summary.md`.

## Commands

### Development

- `npm run dev` - Start local development server at `localhost:4321`
- `npm run build` - Run Astro type checking and build the production site to `./dist/`
- `npm run preview` - Preview production build locally

### Checking

- `npm run check` - Run ESLint, SCSS linting (stylelint), Astro type checking and a production build
- `npm run stylelint:fix` - Auto-fix SCSS lint issues in `src/**/*.scss`

### Database

- `npx drizzle-kit push` - Push schema changes to PostgreSQL database
- `npx drizzle-kit generate` - Generate migration files from schema changes
- `npx drizzle-kit migrate` - Run pending migrations

## Architecture

### Core Technologies

- **Framework**: Astro 5.x with SSR (server-side rendering)
- **Deployment**: Vercel adapter (`@astrojs/vercel`)
- **Authentication**: Better Auth (installed, not wired up yet)
- **Database**: PostgreSQL via Neon with Drizzle ORM
- **AI Integration**: Vercel AI SDK (`ai` package) through the Vercel AI Gateway
- **Search**: Exa (`exa-js`)
- **PWA**: Progressive Web App support via `vite-plugin-pwa`
- **Styles**: SCSS with the Music Copilot design system, plus OpenProps

### Current State

The repository is still the starter scaffold. The theory engine, the progression editor, and the tabs and sheet music editor are not built yet. What exists today:

- `src/pages/index.astro` - Home page
- `src/pages/api/chat.ts` - Streaming chat endpoint using the AI Gateway
- `src/pages/api/posts.ts` - Example CRUD endpoint for posts
- `src/db/` - Drizzle client (`initialize.ts`), schema (`schema.ts`) and Zod validations (`validations.ts`)
- `src/lib/` - Site config, Markdown/HTML conversion, Cheerio DOM helpers and Exa search helpers
- `src/components/Card.astro` and `src/layouts/Layout.astro`

### Planned Architecture

From the spec, the planned flow is:

```text
INPUT (chords, key, tempo, bars)
  → THEORY ENGINE (chord functions, scales, arpeggios, guide tones)
  → SUGGESTIONS (ranked, with reasons)
  → EDITOR (tabs and sheet music)
  → AUTOFILL (rule-based phrase proposals)
  → EXPLAIN (short language-model text from engine output)
  → STORE (on device, with optional sync)
```

- The theory engine is rule-based. Chord functions, scale membership, arpeggios and guide tones come from fixed rules, not from a language model, and are tested against known progressions.
- The language model writes only explanation text and genre or feel labels, and it is given the engine's output as input.
- Audio playback is out of scope for v1.

### Product Rules

Code that produces suggestions must follow these rules from the spec:

- **Explain rule**: every suggestion shows a reason in one or two sentences, drawn from the theory engine.
- **Key rule**: a chord outside the chosen key is labeled as borrowed or outside, not corrected.
- **Note rule**: a note outside the current scale is marked, but never removed.
- **Accept rule**: a suggestion changes the song only after the songwriter accepts it.
- **Count rule**: a progression holds up to sixteen bars in v1. Longer progressions are split into sections.

The language model must not insert notes, chords or phrases without an accepted action, claim one choice is the only correct one, present a suggestion without a reason, use a real artist's song or recording as a template, or store a user's melody to build a profile.

### Data Handling

- Songs are kept on the device by default and synced only when the songwriter chooses an account.
- Melodies and progressions are not used to train models and not shared without an explicit export.
- A teacher sees which sample progressions a student used and how many suggestions were accepted, but not the student's melodies unless shared.

### Accessibility

- Every control works with a keyboard and a screen reader, including note entry and scale selection.
- Scale and chord diagrams have text descriptions, such as "C major scale: C, D, E, F, G, A, B."
- Color is never the only way to show a note's status. Notes in and out of scale also carry a symbol.

### Database Schema

Tables defined in `src/db/schema.ts` (starter tables, to be replaced by songs and progressions):

- **posts**: NanoID primary key, title, slug, content, author fields, publish flags, SEO fields and timestamps
- **comments**: NanoID primary key linked to posts

### API Routes

API endpoints in `src/pages/api/`:

- **POST /api/chat**: Streams a chat response through the Vercel AI Gateway. Takes `messages`, an optional gateway model string (default `openai/gpt-4o`), `temperature` and `maxTokens`.
- **GET/POST/PUT/DELETE /api/posts**: Example CRUD for posts with Zod validation.

### Styles

SCSS lives in `src/styles/`:

- `variables/` - The design system (`colors.scss`, `color-functions.scss`, `tokens.scss`, `effects.scss`, `system.scss`), forwarded together by `globals.scss`, plus `mixins.scss`
- `components/` and `pages/` - Component and page styles
- `globals.scss` - Global styles, imported by `Layout.astro`
- `reset.scss` - CSS reset
- `property-order.json` - Property order enforced by stylelint

`astro.config.mjs` injects `@/styles/variables/globals.scss` into every SCSS file. The look follows the sheet-music style guide in `music-copilot-design-system/style-guide.md`.

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret key for Better Auth (at least 32 characters)
- `BETTER_AUTH_URL` - Base URL for Better Auth (e.g., [http://localhost:4321](http://localhost:4321) for dev)
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key
- `EXA_API_KEY` - Exa search API key

## Development Guidelines

### CRITICAL: Styling Rules

**NEVER put styles in `.astro` files using `<style>` tags. ALWAYS create separate `.scss` files.**

- **Pages**: Create styles in `src/styles/pages/[page-name].scss`
- **Components**: Create styles in `src/styles/components/[component-name].scss`
- **Import**: Use `import '@/styles/pages/[page-name].scss'` in the frontmatter

Example structure:

```astro
---
import Layout from '@/layouts/Layout.astro';
import '@/styles/pages/my-page.scss';  // ← ALWAYS DO THIS
---

<Layout>
    <div class="my-page-container">
        <!-- content -->
    </div>
</Layout>

<!-- NO <style> TAGS HERE! -->
```

This keeps styles organized, reusable, and maintainable. Inline styles make the codebase messy and harder to maintain.

Example:

```typescript
// ❌ WRONG - Don't define types inline
interface User {
    id: string;
    email: string;
}

// ✅ CORRECT - Import from centralized types
import type { User, Session } from 'better-auth';
```

This ensures:

- Type consistency across the codebase
- Easy refactoring and maintenance
- Single source of truth for all type definitions
- Better IDE autocomplete and type checking

### CRITICAL: No 'any' Type

**NEVER use the `any` type anywhere in the codebase.**

- Using `any` defeats the purpose of TypeScript and introduces potential runtime errors.
- If a type is unknown or complex, define a proper interface or use `unknown` with type guards.
- If you encounter a type error, investigate the root cause and fix the type definition instead of bypassing it with `any`.

### CRITICAL: Error Investigation Protocol

**ALWAYS investigate and search for root causes when encountering errors. NEVER implement tangential fixes without understanding the problem.**

When you encounter an error:

1. **Search First**: Use Grep, Glob, or the Task tool with the Explore agent to search the codebase for:
   - Related error messages or error handling code
   - Similar patterns or implementations
   - Documentation or comments explaining the behavior
   - Type definitions and interfaces involved

2. **Search the Web**: If the error is unclear or related to external libraries/frameworks, use WebSearch to:
   - Look up specific error messages or codes
   - Find documentation for the libraries/packages involved
   - Research best practices for the technology stack
   - Check for known issues or breaking changes in dependencies

3. **Read Context**: Read relevant files completely to understand:
   - How the code is supposed to work
   - What dependencies or imports are involved
   - What other parts of the codebase interact with this code
   - What the actual error message means in context

4. **Verify Understanding**: Before implementing a fix:
   - Confirm you understand the root cause
   - Check if similar issues exist elsewhere
   - Consider if the fix addresses the actual problem or just symptoms
   - Look for existing patterns or solutions in the codebase

5. **Avoid Quick Fixes**: DO NOT:
   - Add `any` types without understanding why type checking is failing
   - Comment out code that's causing errors
   - Add try-catch blocks to suppress errors without handling them
   - Make assumptions about what "should" work without verification
   - Apply fixes from external sources without adapting them to this codebase

Example workflow:

```text
❌ WRONG: "Getting a type error, let me add 'as any' to bypass it"
✅ CORRECT: "Getting a type error. Let me search for the type definition, understand what's expected, and check how similar code handles this case."
```

This ensures fixes are targeted, maintainable, and don't introduce new issues.

### Fixing Issues

When asked to fix a GitHub issue, follow these steps in order:

1. **Read the issue**: Read the whole issue and its comments before touching any code.
2. **Fix it**: Make the fix, following the Error Investigation Protocol and the other guidelines in this file. The fix is exactly what the issue asks for, plus whatever the user wants or does not want regarding that issue.
3. **Create the PR only if asked**: If the user has asked for a pull request, create it and link the issue. If they have not, do not create one, and wait for the user to create it. Do not move on to step 4 until a PR exists.
4. **Comment on the original issue**: Once the PR exists, post a comment on the issue saying what was changed and linking the PR. Never comment before the PR exists.
5. **Wait for feedback**: Wait for the user to comment on mistakes, extra changes or anything else that should differ. Then fix exactly what they ask for, and nothing more.

### Database Schema Changes

1. Modify `src/db/schema.ts`
2. Run `npx drizzle-kit generate` to create migration
3. Run `npx drizzle-kit push` to apply to database
4. Migration files stored in `drizzle/`

### PWA Configuration

PWA settings in `astro.config.mjs`:

- Manifest defined in the `VitePWA` options
- Service worker configuration in `workbox` settings
- Runtime caching for API responses

### CRITICAL: Tool Usage Rules

- **NEVER edit source files with scripts you write** (Python, sed, awk, etc.). Make every code change with the Edit tool, file by file. If a bulk change seems to need a script, ask first.
- **NEVER use `cd`** in shell commands. The working directory is already the repository root.
- **NEVER pipe shell commands** (`|`). Run each command on its own and read its full output.

### Code Style Guidelines

**CRITICAL: Always use 4 spaces for indentation, never tabs.**

**CRITICAL: Never hard-wrap comments.** This applies to every language and file type (TypeScript, Astro, SCSS, JavaScript, HTML, Markdown and config files). Write each comment as one line, however long. Do not break a comment across several lines to fit a column width.

```text
❌ WRONG
// Site header with the brand badge and section links.
// Styles live in src/styles/components/header.scss.

✅ CORRECT
// Site header with the brand badge and section links. Styles live in src/styles/components/header.scss.
```

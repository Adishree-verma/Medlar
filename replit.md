# Medlar

An AI-powered dating/relationship chat analysis assistant. Paste a chat (or upload a screenshot) and get instant combined insights: mood, attraction/effort/risk scores, red flags, vibe detection, prediction, and interactive replies — all in one hit.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080); this also builds medlar frontend first
- `pnpm --filter @workspace/medlar run build` — build medlar frontend to `artifacts/medlar/dist/public/`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080) — also serves medlar static frontend
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: OpenAI `gpt-4o` via Replit AI Integrations

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-zod/` — generated Zod schemas (auto-updated by codegen)
- `lib/api-client-react/` — generated React Query hooks (auto-updated by codegen)
- `artifacts/api-server/src/routes/analyze.ts` — all AI route handlers
- `artifacts/api-server/src/app.ts` — Express app; serves medlar frontend via static + SPA fallback
- `artifacts/medlar/src/pages/` — all frontend pages
- `artifacts/medlar/src/context/chat.tsx` — global chat state + localStorage cases
- `artifacts/medlar/src/components/` — shared components (layout, sidebar, medlar assistant)

## Architecture decisions

- The medlar artifact has `localPort = 8080` so proxy routes `/` → the API server (port 8080). The medlar dev workflow is intentionally left unused; the API server handles everything.
- `process.cwd()` in the API server is `artifacts/api-server/`, so the medlar dist path is resolved with `../medlar/dist/public`.
- All AI calls use `gpt-4o` (switched from `gpt-5.4` since gpt-4o has vision support for OCR).
- Quick analysis (`/api/analyze/quick`) returns a combined payload in one AI call — mood, scores, vibe, flags, prediction, safety warning — to eliminate the old menu-based navigation flow.
- Cases (chat history) are stored entirely in localStorage (max 5 entries), no DB needed for this user-facing feature.

## Product

- **Home**: "They're confusing? I'm not." hero. Three-step input: (1) relationship context, (2) paste chat or upload screenshot (OCR), (3) optional case name.
- **Analyze**: Auto-runs quick combined AI analysis. Shows: mood hero, score rings (Attraction/Effort/Risk), their vibe, key points, safety warning, prediction bar, top flags, expandable "Go deeper" section linking to all detail pages.
- **Replies**: 5 vibe mode tabs — Classic, 💅 Delulu, 🧊 Ice Queen, 🧠 Therapist, 😈 Savage — each generates 4 tone-matched replies. Regenerate button per tab.
- **Predict**: Multi-scenario prediction with outcome percentages and pattern insight.
- **History sidebar**: Logo click opens slide-in sidebar showing last 5 saved cases. Each case auto-saved after analysis.
- **Medlar assistant**: Floating chat button (bottom-right) — opens a conversational AI chat about the situation. Only visible when a chat is loaded.
- **Share**: Web Share API with clipboard fallback; generates formatted analysis summary.
- Detail pages: Mood, Flags (full scan), Rate, Damage Control, Next Move.

## User preferences

- Rose & mauve aesthetic (warm dusty rose primary, soft mauve secondary)
- Premium, smooth, non-tacky design — glass cards, rounded-3xl, serif font for headings
- No harsh AI tone — warm, witty, emotionally intelligent voice
- "they're confusing? I'm not." tagline

## Gotchas

- Always rebuild medlar before restarting API server (the dev script does this automatically)
- The medlar workflow (`artifacts/medlar: web`) is unused — the API server serves the frontend
- After changing OpenAPI spec, always run: `pnpm --filter @workspace/api-spec run codegen`
- `process.cwd()` in API server = `artifacts/api-server/` (not workspace root)
- Vision OCR uses `gpt-4o` — don't switch to a non-vision model for that endpoint

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

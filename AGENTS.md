use pnpm to install new packages
always use tailwind 4.1 for styling [https://tailwindcss.com/docs/]
use shadcn-svelte for component and UI [https://www.shadcn-svelte.com/llms.txt]
use better-auth for everything authentication
use Zod for all validation
use cloudflare r2 for image storage [https://developers.cloudflare.com/developer-platform/llms-full.txt]

## Storefront v2 (2026-07-11) — state + follow-up queue

**Shipped on `claude/dnt-custom-storefront` (Fable-led):** the local `artwork` table is now the storefront's single source of truth (Stripe catalog fully retired — Stripe is payment-rail-only via EMBEDDED Checkout with inline `price_data`; buyers never leave the site). One-of-a-kind safety: atomic 30-min reservation holds on checkout, lazy expiry release, webhook marks sold + writes orders idempotently. Brand: dark neon theme from `static/brand.svg`, new landing page, dashboard with description/multi-image/status badges. Local gate: svelte-check 6 errors (ALL pre-existing in `src/lib/components/ui/*`), vitest 21/21, prod build ✓.

### Follow-up queue (codex / GLM 5.2 — pick top-down, one branch per item)

1. **(codex) Lint toolchain repair** — repo `pnpm lint` is broken at baseline: eslint 8 + eslint-plugin-svelte v3 are incompatible (flat-config-only) and ~76 files were never prettier-formatted. Migrate to eslint 9 flat config, `pnpm format` the world in a separate commit, wire `pnpm lint` green.
2. **(codex) svelte-check zero** — fix the 6 remaining pre-existing errors in `src/lib/components/ui/*` (superform/bits-ui typing).
3. **(GLM) Stripe TEST-mode e2e smoke** — with real test keys + `stripe listen` (see STRIPE_LOCAL_SETUP.md): full buy flow incl. oversell 409 (second buyer of the same piece), session expiry → hold release, webhook sold-marking. Automate what's possible in Playwright with STRIPE mock/test-clock, document the manual rest.
4. ~~(GLM) Owner order-notification email~~ **DONE 2026-07-12** (HOA-549/550 — owner email + full fulfillment flow with tracking) — on `checkout.session.completed`, email the artist (Resend free tier or SMTP env) with piece/buyer/shipping. Buyer receipts already come from Stripe — do NOT build buyer email.
5. **(either) /info real copy** — shipping/returns/contact is placeholder-honest; write the real policy with Josh.
6. **(codex, BEFORE 2026-10-01) Node 24 upgrade** — Vercel deprecates Node 20 builds in October, but `@sveltejs/adapter-auto@3` refuses Node >20. Upgrade to current `@sveltejs/adapter-vercel` (or adapter-auto >=4), verify build, then set the Vercel project nodeVersion to 24.x (it's pinned to 20.x today for exactly this reason).
7. **(either) Old `src/lib/components/navbar.svelte`** is unused after the new Site-Header — delete it.

Conventions: match existing code style; never share a checkout (worktrees); gates = check (Δ0 vs baseline) + vitest green + prettier on your files.

@AGENTS.md

# CLAUDE.md — Portfolio Project Reference

## 1. Project

Personal portfolio of **Man Panchotiya**. Goal: look professional to recruiters, clients and investors, with premium 3D animations that tell a story — not decoration.

---

## 2. Positioning

- **Role:** AI/ML Engineer, Data Scientist & Founder
- **Headline:** "I build LLMs, AI Agents & data-driven intelligent software."
- **Founder of:**
  - **Qeist.io** — AI that generates test cases for QA teams
  - **Aoneq Labs** — AI agents & automation for businesses; 2 client projects delivered
- **Focus priority (high → low):** LLM Development → LLM Applications → AI Agents → NLP & Deep Learning → Data Science & ML → Software & Web

---

## 3. Tech Stack

Actual installed versions — do not guess or deviate.

| Package | Version |
|---|---|
| Next.js (App Router, TypeScript) | 16.3.5 |
| React / React DOM | 19.2.8 |
| Tailwind CSS | v4 |
| shadcn/ui style | radix-nova |
| three | 0.186 |
| @react-three/fiber | 9 |
| @react-three/drei | 10 |
| @react-three/postprocessing | 3 |
| gsap + @gsap/react | 3.15 |
| lenis | latest |
| motion | latest |
| recharts | latest |
| resend | latest |
| react-hook-form + zod | latest |
| @vercel/analytics | latest |
| lucide-react | latest |

**Deploy:** Vercel. **Dev OS:** Windows.

**shadcn radix-nova has no `form.tsx`** — build forms with `react-hook-form` + `zod` + `Input`/`Textarea` directly.

---

## 4. Version Notes

> Always use Context7 to verify APIs before writing code. Never rely on memory.

### Next.js 16

- **Turbopack is now stable and the default** for both `next dev` and `next build`. No `--turbopack` flag needed. Old `experimental.turbopack` key moves to top-level `turbopack: {}` in `next.config.ts`.
- **Async Request APIs — sync access fully removed (breaking).** In v15 there was a compatibility shim; in v16 it is gone entirely. The following MUST be `await`ed:
  - `cookies()`, `headers()`, `draftMode()` from `next/headers`
  - `params` in `layout.tsx`, `page.tsx`, `route.ts`, `opengraph-image`, metadata files
  - `searchParams` in `page.tsx`
  - `id` param in sitemap / `generateImageMetadata`
- **`experimental.useCache` and `experimental.dynamicIO` are deprecated.** Replace with top-level `cacheComponents: true` in `next.config.ts`.
- **`'use cache'` directive** (and `'use cache: remote'`) marks async functions/components as cacheable. Use `cacheLife()` and `cacheTag()` from `'next/cache'` for granular control.
- `LayoutProps` generic is available for typed layout props (as seen in `layout.tsx`).

### Tailwind CSS v4

- **No `tailwind.config.js`** — all config lives in CSS via the `@theme {}` block.
- Import with `@import "tailwindcss"` (the old `@tailwind base/components/utilities` directives are removed).
- Define tokens as CSS custom properties inside `@theme`: colors, fonts, breakpoints, easing, etc.
- To override a whole set of defaults, clear the namespace first: `--color-*: initial`.
- `@custom-variant` defines custom variants (e.g. `dark`).
- `@config` and `@plugin` exist only for backward-compat migration — do not use in new code.
- `postcss.config.mjs` uses `@tailwindcss/postcss` (not the old `tailwindcss` postcss plugin).

### React Three Fiber v9

- **R3F v9 requires React 19.** (v8 was for React 18.)
- Canvas is concurrent-mode by default — expensive state updates benefit from `startTransition`.
- **WebGPU renderer** is now supported: pass an async function to the `gl` prop that returns a `WebGPURenderer`.
- When `args` array length or values change, or `object` prop on `<primitive>` changes, R3F reconstructs the instance (detach → dispose → new object → reattach). Keep `args` stable to avoid unnecessary teardown.
- `frameloop="demand"` on `<Canvas>` stops continuous rendering — use for performance.
- `extend()` still required for custom Three.js classes not in the default catalogue.

---

## 5. Design System

- **Dark theme only.** Background `#07070B`. Accent gradient: violet `#7C3AED` → cyan `#06B6D4`.
- **Fonts via `next/font/google`:**
  - `Space Grotesk` — headings
  - `Inter` — body
  - `JetBrains Mono` — tags / code snippets
- Content lives in **glass cards**: subtle backdrop-blur, 1px low-opacity border, dark fill.
- Text must always remain readable over 3D backgrounds.
- **Never:** skill percentage bars, auto-play audio, long loading screens, stock "hacker" visuals.
- **Always** use the `frontend-design` skill for UI decisions — avoid generic AI-looking layouts.
- **Animated UI inspiration:** Aceternity UI, Magic UI, React Bits — glow cards, 3D tilt, text reveal, spotlight effects. Use the shadcn MCP (`mcp__shadcn__*`) to find and add registry components when useful.

---

## 6. Content Architecture

All site text and data live in `/content` as typed TypeScript files. Components **never hardcode content**. Missing real data must be clearly marked `// TODO`.

| File | Owns |
|---|---|
| `profile.ts` | Name, headline, tagline, nav links, social URLs |
| `ventures.ts` | Qeist.io + Aoneq Labs data |
| `focus.ts` | "What I Do" 6-card data |
| `datascience.ts` | DS Showcase stats, steps, chart data |
| `llm.ts` | LLM Lab model card, training chart data, playground URL |
| `projects.ts` | Featured Projects + DS/ML small projects |
| `skills.ts` | All skill categories, tools, chips |
| `scratch.ts` | From Scratch Lab — algorithms, code snippets |
| `blog.ts` | Blog article cards |
| `about.ts` | Bio paragraph + timeline entries |
| `contact.ts` | Contact links, booking URL |

---

## 7. Page Sections (single-page, in order)

1. **Navbar** — "Man Panchotiya" logo; links: Ventures, LLM Lab, Projects, Skills, Contact; "Let's Talk" CTA. Sticky, blur on scroll. No 3D.
2. **Hero** — label, headline, sub-line "Founder · Qeist.io · Aoneq Labs", tags (LLM, Agents, NLP, Deep Learning, ML, Data Science, Full-Stack), buttons: View My Work / Let's Talk, icons: GitHub, LinkedIn, Hugging Face, Kaggle. 3D: neural network right side.
3. **Ventures** — Qeist.io card (LLM, NLP, SaaS; mini animation: text → test-case table) + Aoneq Labs card (Agents, Automation; "2 client projects delivered"). Cards: 3D tilt + glow border.
4. **What I Do** — 6 cards: LLM Development, LLM Applications, AI Agents, NLP & Deep Learning, Data Science & ML, Software & Web.
5. **Data Science Showcase** — "Data → Insights → Decisions", 3 steps (Collect & Clean → Analyze & Visualize → Predict & Deploy), mini dashboard: 2–3 Recharts charts + 3 key stats.
6. **LLM Lab** — "I don't just use LLMs. I build them.", model card (name, params, architecture, dataset, hardware), animated training loss chart, live Hugging Face Space embed, buttons: GitHub / Notebook / Blog.
7. **Featured Projects** — case-study cards (Problem, What I built, Result metric, tech tags, Demo + GitHub). Order: Competitive Intel Agent, QualityPilot, AI Sir, Hermes Lead-gen Agent.
8. **DS/ML/NLP Projects** — small cards in rows of 3: Churn Prediction, Spam Detector, Movie Recommender, IPL Data Analysis. Each: one big metric + small chart.
9. **Skills** — primary big chips + secondary small chips; click category → see tools (tabs). See full breakdown in `skills.ts`.
10. **From Scratch Lab** — "No libraries. Just math." Custom Linear + Logistic Regression, code snippet, 2D line-fitting animation.
11. **Blog** — 3 article cards.
12. **About** — photo, 4–5 line story, timeline: Learning Python & Data Science → ML models → Aoneq Labs → Qeist.io → LLM Lab.
13. **Contact** — "Let's build something intelligent.", form (Name, Email, Message) via Resend, links: Email / LinkedIn / GitHub / Hugging Face / Kaggle, Book a call.
14. **Footer** — name, © 2026, socials.

---

## 8. 3D Map

| Section | 3D weight | Visual description |
|---|---|---|
| Hero | MAIN | Stage 0 — glowing layered neural network; light pulses between nodes; mouse-follow rotation; nodes assemble on load |
| Ventures | medium | Stage 1 — raw data particles; card tilt |
| What I Do | medium | Stage 2 → Stage 3 — scatter clusters morph into neural layers |
| DS Showcase | light | 3D bar chart bars growing on scroll |
| LLM Lab | MAIN | Stage 4 — token cubes + attention lines; tokens flash on playground output |
| Featured Projects | medium | Stage 5 — agent graph with packets moving along edges; card tilt |
| Skills | light / optional | Rotating skill sphere (desktop only) |
| Contact | FINALE | Stage 6 — graph morphs into Qeist.io + Aoneq Labs logos; particle burst on form submit |
| All others | none | 2D animations only |

---

## 9. 3D Architecture Rules

- **ONE fixed `<Canvas>`** behind the entire page — never multiple canvases.
- `SceneManager` reads GSAP ScrollTrigger progress and morphs **one shared particle system** between stages (interpolate positions — do not mount/unmount separate scenes). Transitions must be reversible on scroll-up.
- Use **instanced meshes / `<Points>`** for particles; bloom via `@react-three/postprocessing`.
- Canvas is **lazy-loaded** (`dynamic(() => import(...), { ssr: false })`) with a lightweight CSS fallback gradient.
- DPR capped at `1.5`; pause rendering (`frameloop="never"`) when tab is hidden.
- **Mobile (`< 768px`) and `prefers-reduced-motion`**: skip heavy 3D, show light CSS particles / gradient instead.
- Performance targets: 60 fps desktop, Lighthouse ≥ 90.
- Always use the `threejs-*` skills for 3D work and add brief comments (author is new to 3D).
- Build **one stage at a time** — never multiple 3D stages in a single task.

**File layout:**
```
components/three/
  CanvasRoot.tsx      — mounts <Canvas>, configures DPR/camera/events
  SceneManager.tsx    — ScrollTrigger watcher, stage interpolation
  Effects.tsx         — <EffectComposer> bloom + other post-processing
  stages/
    Stage0Hero.tsx    — neural network
    Stage1Ventures.tsx
    Stage2WhatIDo.tsx
    Stage4LLMLab.tsx  — token cubes + attention lines
    Stage5Projects.tsx
    Stage6Contact.tsx
```

---

## 10. Working Rules

1. **Use Context7** for any Next.js 16, Tailwind v4, R3F, Drei, GSAP, shadcn, or Motion API question. Never rely on training-data memory for these.
2. Use the `threejs-*` skills for all 3D work.
3. After every UI or 3D change: open `localhost:3000` with Playwright, take desktop (1440 px) and mobile (390 px) screenshots, check console errors, review critically, fix before reporting done.
4. Build in **small steps** — one section or one 3D stage per task.
5. Add brief comments explaining *why* in 3D code (author is new to 3D).
6. **Commit to git after each working step** with a clear conventional-commit message.
7. **Do not install new packages** without asking first.
8. Use the `frontend-design` skill before making significant UI decisions.

@AGENTS.md

# CLAUDE.md — Portfolio Project Reference

## 1. Project

Personal portfolio of **Man Panchotiya**. Goal: look professional to recruiters, clients and investors, with premium 3D animations that tell a story — not decoration.

**Visual source of truth:** `reference/portfolio-mockup-v2.html`. Match it closely; do not reinterpret.
Screenshots in `reference/screenshots/` for every section at 1440px and 390px.

---

## 2. Positioning

- **Role:** AI/ML Engineer, Data Scientist & Founder
- **Headline:** "I build LLMs, AI agents & intelligent software."
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

> Always use Context7 to verify APIs before writing code. Never rely on training-data memory for these.

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

## 5. Design System — "Hermes Teal"

### 5.1 Colors (CSS variables — exact values from reference)

```css
--bg:      #041c1c          /* page background */
--bg2:     #052321          /* surface / card fill */
--bg3:     #07302c          /* lighter surface */
--cream:   #ffe6cb          /* primary text */
--cream-2: rgba(255,230,203,.66)  /* secondary text */
--cream-3: rgba(255,230,203,.42)  /* muted / labels */
--line:    rgba(255,230,203,.12)  /* hairline dividers */
--line-2:  rgba(255,230,203,.22)  /* stronger dividers / hover borders */
--panel:   rgba(4,28,28,.72)      /* panel / glass card bg */
--panel-2: rgba(255,230,203,.035) /* hover surface tint */
--em:      #34d399          /* emerald accent — ONLY use for: italic words, active states, pulse/glow nodes, em tags, CTAs, chart lines, timeline dots */
--em-2:    rgba(52,211,153,.16)   /* emerald tint for tag backgrounds */
--amber:   #ffbd38          /* ONLY in terminal/code highlights (req>, [eval] lines) */
--max:     1240px            /* max content width */
--r:       6px               /* panel border-radius */
```

**Amber rule:** `--amber` appears ONLY inside `.term` terminal blocks for syntax-highlight keywords. Never use it in UI chrome, headings, buttons, or section labels.

**Emerald rule:** `--em` is the single accent. Used for: italic words in headings, blinking cursor, availability dot, nav active state, tag borders/fills, emerald buttons, chart strokes, timeline dots. NOT used for body text, nav links, or section backgrounds.

### 5.2 Background Layers (fixed, behind all content)

Four stacked fixed layers (z-index 0–1), content at z-index 2+:

1. **`#canvas` (R3F Canvas)** — neural network, fixed, `inset: 0`, `z-index: 0`, `pointer-events: none`
2. **Glow A** — `760×760px` circle, `right: -200px top: -240px`, `rgba(20,120,95,.22)`, `filter: blur(120px)`, `border-radius: 50%`
3. **Glow B** — `640×640px` circle, `left: -240px bottom: -260px`, `rgba(52,211,153,.08)`, `filter: blur(120px)`, `border-radius: 50%`
4. **Film grain** — fixed `inset: -50%`, `opacity: .07`, SVG fractalNoise `.9` baseFrequency, 3 octaves
5. **Vignette** — `radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(2,14,14,.75) 100%)`

### 5.3 Typography

Fonts via `next/font/google` with `display: swap`. No fallback to Inter or Space Grotesk.

| Font | Variable | Use |
|---|---|---|
| **Instrument Serif** 400 + italic | `--font-serif` | All headings (h1–h4, blockquotes, section h2) |
| **Geist** 400/500 | `--font-sans` | Body text, lead text, card descriptions |
| **Geist Mono** 500 | `--font-mono` | Labels, nav, buttons, tags, status bar — all caps |
| **Courier Prime** 400/700 | `--font-term` | Terminal panels, data numbers, spec grids, code |

**Type scale (from reference):**

| Element | Font | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| Hero H1 | Instrument Serif | 112px (58px mobile) | 400 | .92 | -.03em |
| Section H2 | Instrument Serif | 64px (44px mobile) | 400 | 1 | -.02em |
| Contact H2 | Instrument Serif | 132px | 400 | .9 | -.035em |
| Card H3 | Instrument Serif | 40px | 400 | 1 | -.01em |
| Cap H4 | Instrument Serif | 32px | 400 | 1.05 | — |
| About blockquote | Instrument Serif | 40px | 400 | 1.15 | -.01em |
| Writing H4 | Instrument Serif | 30px | 400 | 1.1 | — |
| Body | Geist | 16px | 400 | 1.6 | — |
| Lead | Geist | 18px | 400 | 1.65 | — |
| Card body | Geist | 15px | 400 | — | — |
| Section label | Geist Mono | 11px | 500 | — | .16em / uppercase |
| Nav links | Geist Mono | 12px | 400 | — | .10em / uppercase |
| Buttons | Geist Mono | 12px | 400 | — | .12em / uppercase |
| Tags | Geist Mono | 10.5px | 400 | — | .10em / uppercase |
| Panel bar | Geist Mono | 10.5px | 400 | — | .14em / uppercase |
| Terminal | Courier Prime | 13px | 400 | 1.75 | — |
| Spec / data numbers | Courier Prime | 14–38px | 400 | — | — |

**Italic rule:** Instrument Serif italic in `--em` emerald is used on the last or most important word in hero/section headings: "LLMs" in hero, "built" in Work, "deployed intelligence", "Deep Learning & ML", "intelligent." in contact, etc. Never italic on body or mono text.

### 5.4 Components

**Status bar**
- Height: `34px`, border-bottom: `1px solid var(--line)`
- Font: Geist Mono, 11px, tracking .12em, uppercase, `var(--cream-3)`
- Left: `• AVAILABLE FOR PROJECTS` (dot = 7px circle, `--em`, `box-shadow: 0 0 10px var(--em)`, `animation: blink 2.4s`)
- Right: IST clock, `· N AGENTS RUNNING` (hidden on mobile)

**Navbar**
- `position: sticky; top: 0; z-index: 20`
- `backdrop-filter: blur(14px); background: rgba(4,28,28,.55); border-bottom: 1px solid var(--line)`
- Height: `66px`
- Brand: `.mk` box `28×28px`, `1px solid var(--line-2)`, 4px radius, Instrument Serif 18px italic "M" inside; then "MAN PANCHOTIYA" in Geist Mono 13px tracking .08em
- Links: numbered `01 WORK` `02 CAPABILITIES` etc., Geist Mono 12px, `--cream-2`; active: cream + `background: var(--panel-2)` + `box-shadow: inset 0 0 0 1px var(--line)`
- CTA button: `.btn.pri` (cream bg, dark text)
- Mobile: brand + CTA only; all nav links hidden

**Buttons**
- Base: `display: inline-flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; padding: 13px 20px; border-radius: 4px; transition: .25s`
- `.btn.pri` — `background: var(--cream); color: var(--bg)` → hover: `background: var(--em)`
- `.btn.ghost` — `box-shadow: inset 0 0 0 1px var(--line-2); color: var(--cream)` → hover: `box-shadow: inset 0 0 0 1px var(--em); color: var(--em)`

**Panel / glass card**
- `background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); backdrop-filter: blur(10px); position: relative; overflow: hidden`
- Panel bar (header): `padding: 12px 16px; border-bottom: 1px solid var(--line); font-family: var(--mono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--cream-3)`
- Hover: `border-color: rgba(52,211,153,.45); transform: translateY(-3px)`

**Corner brackets** (`.corner` mixin)
- Before: `top: -1px; left: -1px` — top-left L-shape
- After: `bottom: -1px; right: -1px` — bottom-right L-shape
- `width: 10px; height: 10px; border: 1px solid var(--em); opacity: .7`

**Tags**
- `font-family: var(--mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; padding: 5px 9px; border: 1px solid var(--line-2); border-radius: 3px; color: var(--cream-2)`
- `.tag.em` — `border-color: rgba(52,211,153,.4); color: var(--em); background: var(--em-2)`

**Section label** (eyebrow above h2)
- `font-family: var(--mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--cream-3)`
- After pseudo: `height: 1px; flex: 0 0 60px; background: var(--line-2)` — horizontal rule

**Section header** (`.shead`)
- `display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; margin-bottom: 56px`
- Left: label + H2. Right: description paragraph (max-width 380px, cream-2, 15px)
- Mobile: stacks vertically, gap 16px

**Section rhythm**
- `padding: 120px 0` (80px mobile)
- `max-width: 1240px`, `.wrap` padding `0 40px` (0 16px mobile)

**Scroll reveal** (`.rv`)
- `opacity: 0; transform: translateY(24px); transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1)`
- `.rv.in-view`: `opacity: 1; transform: none`
- IntersectionObserver at `threshold: 0.12`

**Thin emerald scroll-progress bar** — `3px` bar at very bottom of status bar, width tracks `scrollY / maxScroll`

**Text selection:** `background: var(--em); color: var(--bg)`

**Easing:** `cubic-bezier(.16,1,.3,1)` (expo-out) — used everywhere. No bounce, no spring.

---

## 6. Content Architecture

All site text and data live in `/content` as typed TypeScript files. Components **never hardcode content**. Placeholder metrics shown as `[placeholder]` — never invent numbers.

| File | Owns |
|---|---|
| `profile.ts` | Name, headline, tagline, nav links, social URLs |
| `ventures.ts` | Qeist.io + Aoneq Labs data |
| `focus.ts` | Capabilities 6-cell grid data |
| `datascience.ts` | DS dashboard KPIs, charts, pipeline steps |
| `llm.ts` | LLM card spec, training chart data, playground URL |
| `projects.ts` | Featured Projects + small project cards |
| `skills.ts` | All skill categories, tools |
| `scratch.ts` | From Scratch Lab — algorithms, code snippets |
| `blog.ts` | Blog/writing article rows |
| `about.ts` | Bio quote + timeline entries |
| `contact.ts` | Contact links, booking URL |

---

## 7. Page Sections (single-page, in recruiter-first order)

1. **Status bar** — mono uppercase; left: availability dot + "AVAILABLE FOR PROJECTS"; right: IST clock, "· N AGENTS RUNNING". Thin emerald scroll-progress bar below.
2. **Navbar** — sticky; brand (M mark + "MAN PANCHOTIYA"); numbered links "01 WORK · 02 CAPABILITIES · 03 DATA · 04 ABOUT · 05 WRITING"; "LET'S TALK →" CTA button. Active link follows section in view.
3. **Hero** — label "AI/ML ENGINEER · DATA SCIENTIST · FOUNDER"; serif H1 "I build *LLMs*, AI agents & intelligent software|" (blinking cursor, "LLMs" italic emerald); lead text; two CTAs (VIEW SELECTED WORK ↓ / BOOK A CALL); live LLM training terminal panel right side (step / loss / tok/s); proof strip (Founder Qeist.io · Founder Aoneq Labs · 2 client deployments · LLM from scratch). 3D: neural network always visible.
4. **Selected Work** — label + "Things I've *built*"; 12-col grid: Qeist.io (span 7, flagship panel with terminal test-case generation), My own LLM (span 5, spec grid + loss chart), then 3 span-4 cards: Competitive Intel Agent, QualityPilot, Hermes Lead-gen Agent.
5. **Capabilities** — label + "From raw data to *deployed intelligence*"; 3×2 grid (hairline borders): LLM Development, LLM Applications, AI Agents (all `.pri`), NLP & Deep Learning, Data Science & ML, Software & Web (supporting). Each cell: h4 serif with italic em word, short description, tools in Courier Prime.
6. **Data Science & ML** — label + "Data → insight → *decision*"; KPI cards with sparklines; feature-importance bars; confusion matrix; 4-step pipeline row (Collect & clean → Explore → Model → Deploy). All metrics as visible `[placeholder]` values.
7. **Stack** — label + "Tools I *reach for*"; 2-col grouped rows (Geist Mono header → Courier Prime tool list); no percentage bars.
8. **About** — label + serif quote "I learned ML by building it from the math up — now I build *companies* on top of it."; left: photo placeholder; right: bio text + timeline (vertical line with em dots; entries fill on scroll).
9. **Writing** — label + h2; 3 post rows (Geist Mono date+category / Instrument Serif title / mono tags / arrow); border-top/bottom hairlines.
10. **Contact** — label + huge serif H2 "Let's build something *intelligent*."; 2-col grid: left = terminal-style form (Courier Prime `name>` `email>` `msg>` prompts, `.btn.pri` SEND MESSAGE); right = links panel (EMAIL / LINKEDIN / GITHUB / HUGGING FACE / BOOK A CALL — mono uppercase, Courier Prime value, arrow).
11. **Footer** — `border-top: 1px solid var(--line)`; left: "© 2026 MAN PANCHOTIYA"; right: "BUILT WITH NEXT.JS · THREE.JS" — both Geist Mono 11px uppercase.

---

## 8. 3D Scroll Story (R3F + GSAP ScrollTrigger)

**ONE fixed `<Canvas>`** behind the entire page. **Network topology: 6–10–14–14–10–6.** Nodes: cream. Active nodes + signal pulses: emerald. Edges: faint `rgba(160,235,205,.085)`. Pulses travel layer to layer with a trailing gradient tail — 40 pulses always alive. Idle auto-rotation + mouse parallax at all times.

### Hero Pin (~400vh desktop / ~220vh mobile)

The hero section is **pinned** with GSAP ScrollTrigger. Scroll progress `0→1` within the pin drives the camera through these stages, fully scrubbed and reversible:

**Stage A · Idle (progress 0–0.08)**
Network on the right side, slowly rotating, hero text fully visible. Camera at rest, no transition yet.

**Stage B · Dive into a neuron (progress 0.08–0.35)**
- Hero text + terminal panel fade up and out
- One neuron in a middle hidden layer highlights (bright emerald glow)
- Camera flies toward that neuron (smooth expo-out ease)
- Network blurs and fades around it
- Neuron grows to fill the entire viewport as camera passes inside

**Stage C · Inside the neuron (progress 0.35–0.50)**
Interior scene showing how a neuron works — always animated:
- 4–6 input signals flow in from left, each labeled x₁…xₙ with weight value (e.g. `w₁ = 0.42`); line thickness proportional to weight magnitude
- Signals merge into a glowing core labeled `Σ(w·x) + b` with bias shown
- Core passes through an activation curve (GELU) drawn in 3D or as `<Html>` overlay
- One output signal leaves right labeled "output → next layer"
- All labels: `drei <Html>` with Courier Prime / Geist Mono, cream + emerald, always readable

**Stage D · Exit (progress 0.50–0.60)**
Camera pulls back out through the neuron. Full network reappears, now centered on screen.

**Stage E · Orbit & inspect (progress 0.60–0.95)**
Camera orbits the network across multiple axes (front → side → top → back → front). Pulses keep flowing. A HUD panel (panel style with corner brackets) shows live values **computed from the actual scene topology in code** (never hardcoded):
- Architecture: 6 → 10 → 14 → 14 → 10 → 6
- Layers: 6 · Neurons: 60
- Weights: 596 · Biases: 54 · Total params: 650
- Activation: GELU
- View: FRONT / SIDE / TOP / BACK (updates as camera orbits)
- Camera angle in degrees
- Active signals: live count
Layer labels (Input, Hidden 1–4, Output) float next to each layer with `drei <Html>`.

**Stage F · Release (progress 0.95–1.0)**
Unpin. Network moves to right side, scales down to ~40% opacity, keeps idling behind the rest of the page as a persistent background.

### Scroll animations for all other sections

- **Section labels:** line draws left→right on enter; heading words reveal one-by-one; italic emerald word reveals last
- **Panels/cards:** stagger fade-up (`translateY 24px → 0`), 80ms between children; corner brackets draw in with stroke-dashoffset
- **Qeist.io test-case table:** rows appear one by one (700ms between), loop after delay
- **LLM loss chart SVG:** stroke-dashoffset scrubbed with scroll (draws the line as you scroll past)
- **KPI numbers:** count up when in view
- **Feature-importance bars:** `scaleX(0 → 1)` with expo-out when in view
- **Confusion matrix cells:** fade in staggered by value intensity
- **Capabilities grid lines:** draw in (`scaleX/Y(0 → 1)`) as section enters
- **Stack rows:** slide in from left, staggered
- **About timeline:** vertical line fills from top with scroll; dots light up (em glow) as you scroll past each
- **Contact headline:** scale 0.95→1 + opacity reveal on enter
- **Active nav link:** updates via IntersectionObserver on each section, scrollspy

**Lenis smooth scroll** synced with GSAP ScrollTrigger (`ScrollTrigger.scrollerProxy` or Lenis GSAP plugin).

---

## 9. 3D Architecture Rules

- **ONE fixed `<Canvas>`** — never multiple canvases.
- `SceneManager` reads GSAP ScrollTrigger pin progress and drives all camera transitions. Transitions are fully reversible on scroll-up.
- Use **instanced meshes / `<Points>`** for particles; bloom via `@react-three/postprocessing`.
- Canvas is **lazy-loaded** (`dynamic(() => import(...), { ssr: false })`) with a static CSS gradient fallback.
- **DPR capped at `1.5`**; pause rendering (`frameloop="never"`) when tab is hidden.
- **Mobile (`< 900px`):** fewer nodes (e.g. `[4,6,8,8,6,4]`), shorter pin (~220vh), simplified neuron interior.
- **`prefers-reduced-motion`:** no pin, no camera flight, static network at right side + instant reveals.
- Text must remain readable over 3D at every stage (panel bg + vignette ensure this).
- Performance targets: 60 fps desktop, Lighthouse ≥ 90.
- Always use the `threejs-*` skills for all 3D work. Add brief comments (author is new to 3D).
- Build **one stage at a time** — never multiple stages in one task.

**File layout:**
```
components/three/
  CanvasRoot.tsx      — mounts <Canvas>, DPR cap, camera, events
  SceneManager.tsx    — GSAP ScrollTrigger watcher, all stage transitions
  Effects.tsx         — <EffectComposer> bloom + post-processing
  stages/
    Stage0Hero.tsx    — idle network, mouse parallax (Stages A+F)
    Stage1Ventures.tsx  — (unused — neuron dive replaces old stage plan)
    Stage2WhatIDo.tsx   — (unused)
    Stage4LLMLab.tsx    — (unused)
    Stage5Projects.tsx  — (unused)
    Stage6Contact.tsx   — (unused)
    NeuronInterior.tsx  — Stage C interior scene
    HUDPanel.tsx        — Stage E orbit HUD with live topology values
```

> Note: The old stage stubs (Stage1–6) remain on disk but are superseded by the new scroll story. Do not delete them yet; repurpose or replace as sections are built.

---

## 10. Working Rules

1. **Use Context7** for any Next.js 16, Tailwind v4, R3F, Drei, GSAP, shadcn, Lenis, or Motion API question. Never rely on training-data memory for these.
2. Use the `threejs-*` skills for all 3D work.
3. After every UI or 3D change: open `localhost:3000` with Playwright, take desktop (1440 px) and mobile (390 px) screenshots, check console errors, compare against `reference/screenshots/`, fix before reporting done.
4. Build in **small steps** — one section or one 3D stage per task.
5. Add brief comments explaining *why* in 3D code (author is new to 3D).
6. **Commit to git after each working step** with a clear conventional-commit message.
7. **Do not install new packages** without asking first.
8. Use the `frontend-design` skill before making significant UI decisions that aren't already defined in this file.
9. **All placeholder metrics stay as visible `[placeholder]` text** — never invent numbers.

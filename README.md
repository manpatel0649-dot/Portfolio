# Man Panchotiya — Portfolio

Personal portfolio built with Next.js 16, Three.js/R3F, GSAP, and Tailwind CSS v4.

## Setup

1. Clone the repo
2. `npm install`
3. Copy `.env.example` → `.env.local` and fill in your values
4. `npm run dev` — starts on http://localhost:3000

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Optional | Resend API key for contact form. Without it, form falls back to mailto. |

## Editing Content

All site copy lives in `/content/*.ts` — edit those files to update text, links, and data.

| File | What it controls |
|---|---|
| `content/profile.ts` | Name, headline, social links |
| `content/ventures.ts` | Qeist.io and Aoneq Labs details |
| `content/projects.ts` | Work section cards |
| `content/about.ts` | Bio and timeline |
| `content/contact.ts` | Contact links |
| `content/datascience.ts` | DS dashboard KPIs and pipeline |
| `content/skills.ts` | Stack section |
| `content/blog.ts` | Writing section posts |

## Deploy to Vercel

1. Push to GitHub (`git push origin main`)
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. In Project Settings → Environment Variables, add `RESEND_API_KEY`
4. Vercel auto-deploys on every push to `main`

## Custom Domain

In Vercel: Project → Settings → Domains → Add domain → follow the DNS instructions.

After connecting, update two files to match your domain:
- `metadataBase` in `app/layout.tsx`
- The sitemap URL in `app/sitemap.ts`

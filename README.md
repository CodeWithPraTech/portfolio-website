# Portfolio OS

A premium, interactive personal operating system for a Data Scientist and Machine Learning Engineer. It is designed to show projects, business problem solving, learning velocity, daily progress, research, writing, and long-term growth in public.

## What Is Included

- Dark, responsive portfolio OS inspired by Stripe, Linear, Vercel, Notion, and GitHub.
- Home, Now, About, Education, Experience, Skills, Projects, Blog, Roadmap, Research, Resume, Contact, and Daily Progress Dashboard views.
- Build in Public and Learn in Public system with daily logs, heatmap, progress bars, charts, goals, notes, and study consistency.
- Project case studies with overview, problem statement, dataset, architecture, stack, metrics, links, and lessons.
- Owner Console for editing content without code changes.
- Local AI-style insights for career summary, learning recommendations, project suggestions, and progress analytics.
- Production docs for database schema, API design, auth, deployment, GitHub, LeetCode, and AI integrations.

## Quick Start

Run the local Node server from this folder:

```bash
npm run dev
```

For live Notion sync, configure the required Notion token and roadmap data-source id in a local `.env` file. Keep `.env` private; it is ignored by Git.

Then run:

```bash
npm run dev
```

The default local URL is:

```text
http://localhost:4173
```

Do not use `python -m http.server` if you expect Notion status changes to sync. Python only serves static files and cannot run `/api/notion/learning-playlists`.

## Owner Console

Use the `Update Site` or `Owner Console` button. The admin password is:

```text
Pratik@123
```

Clicking `Update Site` or `Owner Console` asks for verification when admin is not already verified. After verification, admin can edit all content and manage page visibility from the Public Page Visibility checkboxes. The admin session remains active in that browser for 2 weeks unless you exit admin mode. Visitors only see pages marked public.

Edits and the 2-week admin verification are stored in this browser in the static version. For real production security across devices, use backend authentication and the schema/API docs in `docs/`.

## Customize

Edit seeded content in `data.js`:

- `profile`: name, title, mission, socials, GitHub username, LeetCode username.
- `pageVisibility`: controls which pages are visible to visitors.
- `experience`: designation, company, period, location, employment type, current-role flag, business focus, and impact bullets.
- `learningPlaylists`: Notion-backed study playlists, starting with the 45-session statistics and advanced analytics roadmap.
- `projects`: project case studies.
- `progress`: daily progress entries.
- `roadmap`: learning path.
- `reading`: books, papers, courses, articles, certifications.
- `blogs`: writing and learning notes.

## Recommended Production Stack

- Frontend: Next.js or Astro with this UI/component model.
- Auth: Clerk, Auth.js, Supabase Auth, or Firebase Auth.
- Database: PostgreSQL with Prisma or Drizzle.
- Storage: Supabase Storage, S3, or UploadThing.
- Analytics: Vercel Analytics and PostHog.
- AI: OpenAI API for recommendations, summaries, and progress insights.
- Deployment: Vercel, Netlify, or Cloudflare Pages.

## Integrations

GitHub and LeetCode are documented in `docs/API_DESIGN.md`. For a static deploy, use scheduled serverless functions to cache external stats and avoid rate limits.

## Files

- `index.html`: App shell and admin dialog.
- `styles.css`: Premium responsive UI system.
- `app.js`: Routing, rendering, charts, admin editing, search, local insights.
- `data.js`: Sample content and editable data model.
- `docs/DATABASE_SCHEMA.md`: Production database schema.
- `docs/API_DESIGN.md`: API routes and integration design.
- `docs/DEPLOYMENT.md`: Deployment and scalability checklist.

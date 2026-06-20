# Deployment

## Static Deployment

This repo can deploy immediately as a static site.

### Vercel

1. Import the repository.
2. Framework preset: Other.
3. Output directory: `.`.
4. Deploy.

### Netlify

1. Import the repository.
2. Build command: leave empty.
3. Publish directory: `.`.
4. Deploy.

## Production App Upgrade

For authenticated editing, database persistence, and server-side integrations:

1. Move the UI into Next.js or Astro.
2. Create the PostgreSQL schema from `docs/DATABASE_SCHEMA.md`.
3. Add owner authentication with Clerk, Auth.js, Supabase Auth, or Firebase Auth.
4. Implement API routes from `docs/API_DESIGN.md`.
5. Move GitHub, LeetCode, and AI calls to server routes.
6. Add scheduled jobs for integration cache refreshes.
7. Replace local storage admin editor with authenticated CRUD forms.

## Environment Variables

Configure secrets only inside your hosting provider's private environment-variable settings. Do not commit API keys, tokens, auth secrets, database URLs, owner emails, or site-specific deployment values into the repository.

## Performance Checklist

- Cache public API responses.
- Render critical content server-side or statically.
- Lazy-load admin dashboard.
- Use compressed images and avoid blocking third-party scripts.
- Add `Cache-Control` headers for static assets.
- Keep AI and external integration calls off the public render path.

## SEO Checklist

- Replace placeholder name and social links in `data.js`, `index.html`, `sitemap.xml`, and `robots.txt`.
- Add Open Graph image.
- Create canonical URLs for blog posts.
- Generate JSON-LD for `Person`, `CreativeWork`, and `BlogPosting`.
- Keep project titles and summaries descriptive.

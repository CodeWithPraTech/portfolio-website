# API Design

These routes can be implemented as Next.js route handlers, Express routes, FastAPI endpoints, or serverless functions.

## Public Read Routes

```text
GET /api/profile
GET /api/projects?category=Machine%20Learning
GET /api/blogs
GET /api/blogs/:slug
GET /api/progress?range=90d
GET /api/roadmap
GET /api/reading
GET /api/skills
GET /api/experience
GET /api/notion/learning-playlists
GET /api/github
GET /api/leetcode
GET /api/insights
```

## Owner Routes

Require authenticated owner session.

```text
POST   /api/projects
PATCH  /api/projects/:id
DELETE /api/projects/:id

POST   /api/blogs
PATCH  /api/blogs/:id
DELETE /api/blogs/:id

POST   /api/progress
PATCH  /api/progress/:id
DELETE /api/progress/:id

POST   /api/skills
PATCH  /api/skills/:id
DELETE /api/skills/:id

POST   /api/experience
PATCH  /api/experience/:id
DELETE /api/experience/:id

POST   /api/roadmap
PATCH  /api/roadmap/:id
DELETE /api/roadmap/:id

POST   /api/reading
PATCH  /api/reading/:id
DELETE /api/reading/:id
```

## GitHub Integration

Use the GitHub GraphQL API from a scheduled serverless job.

Recommended cached payload:

```json
{
  "username": "yourusername",
  "repositories": [
    {
      "name": "bi-copilot",
      "description": "Business intelligence copilot",
      "url": "https://github.com/yourusername/bi-copilot",
      "stars": 12,
      "language": "Python",
      "updatedAt": "2026-06-06T00:00:00Z"
    }
  ],
  "contributionCalendar": {
    "totalContributions": 540,
    "weeks": []
  }
}
```

Refresh every 6 to 12 hours to avoid rate-limit pressure.

## LeetCode Integration

LeetCode does not provide a stable official public API for all stats. Use one of these approaches:

- Preferred: user-maintained JSON stat file updated manually or via GitHub Action.
- Alternative: serverless fetch from a community GraphQL endpoint with caching and graceful failure.

Never block page rendering on LeetCode availability.

## AI Features

Use an authenticated server route so API keys never reach the browser.

```text
POST /api/ai/career-summary
POST /api/ai/learning-recommendations
POST /api/ai/project-recommendations
POST /api/ai/progress-insights
```

Input should include compact portfolio state:

```json
{
  "skills": [],
  "projects": [],
  "recentProgress": [],
  "roadmap": [],
  "careerGoals": []
}
```

Return structured JSON:

```json
{
  "headline": "Business-aware ML engineer building production AI systems",
  "insights": ["..."],
  "recommendations": ["..."],
  "nextActions": ["..."]
}
```

Cache outputs in `ai_insights` by input hash so repeated page views are fast.

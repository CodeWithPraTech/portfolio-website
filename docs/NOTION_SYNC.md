# Notion Sync

The portfolio Learning Progress page is joined to this Notion database as the first study playlist:

```text
40-Day Statistics + Advanced Analytics Roadmap
https://app.notion.com/p/051bf939e4494495814432db72ff5b26
collection://615b10c7-4074-403f-a837-7844e940ebb9
```

## Current Sync Flow

The website has a `learningPlaylists` collection in `data.js`. It contains the seeded 45-session statistics playlist, but the Learning Progress page now overlays synced Notion data at runtime.

The browser checks this source:

```text
GET /api/notion/learning-playlists
```

This means the seeded roadmap still works if the API is unavailable, but Notion status/progress only becomes live when the API is running with a Notion token. There is no static fallback file because that can become stale and show the wrong status.

The roadmap includes 40 learning sessions plus 5 weekly revision sessions. Each session contains:

- Day, Date, Reminder Date, Week, and Session Type.
- Status, Progress, Hours, and Website Visible.
- Focus Area, Topics, Resources, Important Concepts, Practice Questions, and Notes.
- Notes Upload support in Notion for attaching study notes or files.

Future playlists can be added by creating another Notion database with the same schema, then adding another item to `learningPlaylists` and the API response.

The site now includes a second Notion-backed playlist:

```text
45-Day Applied Scientist Prep Roadmap
https://app.notion.com/p/7b8c13855ad04e9c9865e4916e042503
collection://bd7b9097-7e0d-439e-a8b8-05fdab9140a6
```

This playlist tracks Applied Scientist / Research Engineer / Data Scientist interview preparation with textbook references, derivations, Python easy/medium/hard tasks, DSA tasks, and three project lanes.

## Live Production Sync

The repo includes this server route:

```text
GET /api/notion/learning-playlists
```

The route should:

1. Use a server-side Notion token.
2. Query each configured playlist data source, starting with `615b10c7-4074-403f-a837-7844e940ebb9`.
3. Filter `Website Visible = true`.
4. Sort by `Date` ascending.
5. Return public fields only: day, date, reminderDate, week, sessionType, status, progress, focusArea, topics, resources, importantConcepts, practiceQuestions, tasks, hours, notes, notesUpload, visible.
6. Return `Cache-Control: no-store` so status changes reflect on refresh.

Never call the Notion API directly from browser JavaScript because that would expose the integration token.

Set the required Notion token and roadmap data-source id as private deployment environment variables in your hosting provider.

For the Applied Scientist playlist, also set:

```text
NOTION_APPLIED_SCIENTIST_DATA_SOURCE_ID=bd7b9097-7e0d-439e-a8b8-05fdab9140a6
NOTION_APPLIED_SCIENTIST_DATABASE_URL=https://app.notion.com/p/7b8c13855ad04e9c9865e4916e042503
```

The Notion integration must be connected to the roadmap database in Notion. After that, marking a session `Complete`, changing `Progress`, or toggling `Website Visible` in Notion will be reflected on the website through the API.

## Local Development

Use the Node dev server, not Python's static server. Create a local `.env` file with the required Notion token and roadmap data-source id. Keep that file private; it is ignored by Git.

Then run:

```bash
npm run dev
```

Then open:

```text
http://localhost:4173/#learning
```

If the Learning Progress page shows a sync error, the server is running without `NOTION_API_KEY` or the Notion integration is not connected to the roadmap database.

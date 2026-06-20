import { buildLearningPlaylistPayload } from "../../lib/notion-learning-sync.js";

export default async function handler(request, response) {
  try {
    const token = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
    const payload = await buildLearningPlaylistPayload(token);
    response.setHeader("Cache-Control", "no-store, max-age=0");
    return response.status(200).json(payload);
  } catch (error) {
    return response.status(error.statusCode || 500).json({
      error: error.message || "Unable to sync Notion roadmap",
      learningPlaylists: []
    });
  }
}

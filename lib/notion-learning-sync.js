export const dataSourceId = process.env.NOTION_LEARNING_DATA_SOURCE_ID || "615b10c7-4074-403f-a837-7844e940ebb9";
export const notionDatabaseUrl = "https://app.notion.com/p/051bf939e4494495814432db72ff5b26";

export async function buildLearningPlaylistPayload(token) {
  if (!token) {
    const error = new Error("Missing NOTION_API_KEY");
    error.statusCode = 503;
    throw error;
  }

  const rows = await queryAllRows(token);
  const days = rows.map(mapNotionPage).filter((day) => day.visible !== false);

  return {
    syncedAt: new Date().toISOString(),
    learningPlaylists: [
      {
        id: "statistics-advanced-45-sessions",
        title: "40-Day Statistics + Advanced Analytics Roadmap",
        category: "Statistics, MAANG and BFSI",
        status: "Synced from Notion",
        notionDatabaseUrl,
        notionDataSourceId: dataSourceId,
        days
      }
    ]
  };
}

async function queryAllRows(token) {
  const rows = [];
  let startCursor;

  do {
    const notionResponse = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2026-03-11"
      },
      body: JSON.stringify({
        page_size: 100,
        start_cursor: startCursor,
        filter: {
          property: "Website Visible",
          checkbox: { equals: true }
        },
        sorts: [
          {
            property: "Date",
            direction: "ascending"
          }
        ]
      })
    });

    if (!notionResponse.ok) {
      const detail = await notionResponse.text();
      if (notionResponse.status === 404 && detail.includes("Make sure the relevant pages and databases are shared")) {
        throw new Error("Notion token is valid, but the roadmap database is not shared with this integration. Open the roadmap database in Notion, use Connections, and add the integration.");
      }
      throw new Error(`Notion sync failed: ${notionResponse.status} ${detail}`);
    }

    const payload = await notionResponse.json();
    rows.push(...(payload.results || []));
    startCursor = payload.has_more ? payload.next_cursor : undefined;
  } while (startCursor);

  return rows;
}

function mapNotionPage(page) {
  const properties = page.properties || {};
  const status = selectValue(properties.Status) || "Pending";
  const progress = normalizeProgress(numberValue(properties.Progress), status);

  return {
    day: titleValue(properties.Day),
    date: dateValue(properties.Date),
    reminderDate: dateValue(properties["Reminder Date"]),
    week: selectValue(properties.Week),
    sessionType: selectValue(properties["Session Type"]) || "Core",
    status,
    progress,
    focusArea: textValue(properties["Focus Area"]),
    topics: multiSelectValue(properties.Topics),
    resources: textValue(properties.Resources),
    importantConcepts: textValue(properties["Important Concepts"]),
    practiceQuestions: textValue(properties["Practice Questions"]),
    tasks: textValue(properties.Tasks),
    hours: numberValue(properties.Hours) || 1.5,
    notes: textValue(properties.Notes),
    notesUpload: fileValue(properties["Notes Upload"]),
    visible: checkboxValue(properties["Website Visible"]) !== false
  };
}

function normalizeProgress(progress, status) {
  if (String(status).toLowerCase() === "complete") return Math.max(progress || 0, 100);
  return progress || 0;
}

function titleValue(property) {
  return (property?.title || []).map((part) => part.plain_text || "").join("");
}

function textValue(property) {
  return (property?.rich_text || []).map((part) => part.plain_text || "").join("");
}

function selectValue(property) {
  return property?.select?.name || property?.status?.name || "";
}

function multiSelectValue(property) {
  return (property?.multi_select || []).map((item) => item.name);
}

function dateValue(property) {
  return property?.date?.start || "";
}

function numberValue(property) {
  return Number(property?.number) || 0;
}

function checkboxValue(property) {
  return Boolean(property?.checkbox);
}

function fileValue(property) {
  const file = property?.files?.[0];
  if (!file) return "";
  return file.type === "external" ? file.external?.url || "" : file.file?.url || "";
}

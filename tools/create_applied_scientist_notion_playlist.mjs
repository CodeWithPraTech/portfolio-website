import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { appliedScientistSessions } from "../applied-scientist-roadmap.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const envPath = join(root, ".env");
const notionVersion = "2026-03-11";
const defaultParentPageId = "051bf939-e449-4495-8144-32db72ff5b26";

await loadEnvFile();

const token = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
if (!token) throw new Error("Missing NOTION_API_KEY in .env");

let dataSourceId = process.env.NOTION_APPLIED_SCIENTIST_DATA_SOURCE_ID || "";
let databaseUrl = process.env.NOTION_APPLIED_SCIENTIST_DATABASE_URL || "";

if (!dataSourceId) {
  const created = await createDatabase();
  dataSourceId = created.dataSourceId;
  databaseUrl = created.url;
  await upsertEnv("NOTION_APPLIED_SCIENTIST_DATA_SOURCE_ID", dataSourceId);
  if (databaseUrl) await upsertEnv("NOTION_APPLIED_SCIENTIST_DATABASE_URL", databaseUrl);
}

await ensureDataSourceSchema(dataSourceId);
await archiveExistingRows(dataSourceId);
for (const session of appliedScientistSessions) {
  await createSessionPage(dataSourceId, session);
}

const rows = await queryRows(dataSourceId);
console.log(JSON.stringify({
  created_or_reused_data_source_id: dataSourceId,
  database_url: databaseUrl,
  inserted_visible_rows: rows.length,
  first_day: rows[0]?.properties?.Day?.title?.[0]?.plain_text || "",
  last_day: rows.at(-1)?.properties?.Day?.title?.[0]?.plain_text || ""
}, null, 2));

async function loadEnvFile() {
  try {
    const content = await readFile(envPath, "utf8");
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
      const [key, ...valueParts] = trimmed.split("=");
      if (process.env[key]) return;
      process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    });
  } catch {
    // .env is optional until the Notion token is needed.
  }
}

async function upsertEnv(key, value) {
  let content = "";
  try {
    content = await readFile(envPath, "utf8");
  } catch {
    content = "";
  }
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=`, "m").test(content)) {
    content = content.replace(new RegExp(`^${key}=.*$`, "m"), line);
  } else {
    content = `${content.trimEnd()}\n${line}\n`;
  }
  await writeFile(envPath, content, "utf8");
}

async function notionFetch(path, options = {}) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": notionVersion,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`Notion API ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function createDatabase() {
  const parentPageId = process.env.NOTION_APPLIED_SCIENTIST_PARENT_PAGE_ID || defaultParentPageId;
  let database;
  try {
    database = await createDatabaseUnderPage(parentPageId);
  } catch (error) {
    if (!String(error.message).includes("parented by a database")) throw error;
    const container = await createContainerPage();
    database = await createDatabaseUnderPage(container.id);
  }

  return {
    dataSourceId: database.data_sources?.[0]?.id || database.id,
    url: database.url || ""
  };
}

async function createDatabaseUnderPage(pageId) {
  return notionFetch("/databases", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "page_id", page_id: pageId },
      title: [{ type: "text", text: { content: "45-Day Applied Scientist Prep Roadmap" } }],
      properties: databaseProperties()
    })
  });
}

async function createContainerPage() {
  const sourceId = process.env.NOTION_LEARNING_DATA_SOURCE_ID;
  if (!sourceId) throw new Error("NOTION_LEARNING_DATA_SOURCE_ID is required to create a hidden container page.");
  return notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "data_source_id", data_source_id: sourceId },
      properties: {
        Day: title("45-Day Applied Scientist Prep Roadmap"),
        Status: select("Pending"),
        Progress: { number: 0 },
        Notes: richText("Hidden container page for the Applied Scientist prep database."),
        "Website Visible": { checkbox: false }
      }
    })
  });
}

function databaseProperties() {
  return {
    Day: { title: {} },
    Date: { date: {} },
    "Reminder Date": { date: {} },
    Week: { select: { options: selectOptions(["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"]) } },
    Phase: { select: { options: selectOptions(["Math Foundation", "Statistics Foundation", "Data Mining Foundation", "Computer Science Foundation", "Foundation Review", "Classical ML", "Deep Learning", "Deep Learning Review", "NLP", "Transformers", "LLMs", "GenAI/RAG", "Agents", "Reinforcement Learning", "Interview Conversion"]) } },
    "Session Type": { select: { options: selectOptions(["Foundation", "Core", "Advanced", "Mock"]) } },
    Status: { select: { options: selectOptions(["Pending", "In Progress", "Complete", "Skipped"]) } },
    Progress: { number: { format: "number" } },
    "Primary Topic": { rich_text: {} },
    "Book Reference": { rich_text: {} },
    "Chapter / Section": { rich_text: {} },
    "Page Range": { rich_text: {} },
    "Page Reference Confidence": { select: { options: selectOptions(["Verified", "Edition Default", "Needs PDF Verification"]) } },
    "Important Concepts": { rich_text: {} },
    "Derivation / Theory Task": { rich_text: {} },
    "Python Easy": { rich_text: {} },
    "Python Medium": { rich_text: {} },
    "Python Hard / Mini Project": { rich_text: {} },
    "DSA Topic": { rich_text: {} },
    "DSA Problem": { rich_text: {} },
    "Project 1 Task": { rich_text: {} },
    "Project 2 Task": { rich_text: {} },
    "Project 3 Task": { rich_text: {} },
    "Interview Output": { rich_text: {} },
    Hours: { number: { format: "number" } },
    Notes: { rich_text: {} },
    "Notes Upload": { files: {} },
    "Website Visible": { checkbox: {} }
  };
}

async function ensureDataSourceSchema(sourceId) {
  const current = await notionFetch(`/data_sources/${sourceId}`);
  const properties = dataSourceProperties();
  if (current.properties?.Name && !current.properties?.Day) {
    properties.Name = { name: "Day" };
  }
  await notionFetch(`/data_sources/${sourceId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties })
  });
}

function dataSourceProperties() {
  const { Day, ...properties } = databaseProperties();
  return properties;
}

function selectOptions(names) {
  return names.map((name) => ({ name }));
}

async function archiveExistingRows(sourceId) {
  const existing = await queryRows(sourceId, false);
  for (const page of existing) {
    await notionFetch(`/pages/${page.id}`, {
      method: "PATCH",
      body: JSON.stringify({ in_trash: true })
    });
  }
}

async function queryRows(sourceId, visibleOnly = true) {
  const results = [];
  let startCursor;
  do {
    const body = {
      page_size: 100,
      start_cursor: startCursor,
      sorts: [{ property: "Date", direction: "ascending" }]
    };
    if (visibleOnly) {
      body.filter = { property: "Website Visible", checkbox: { equals: true } };
    }
    const response = await notionFetch(`/data_sources/${sourceId}/query`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    results.push(...(response.results || []));
    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);
  return results;
}

async function createSessionPage(sourceId, session) {
  return notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "data_source_id", data_source_id: sourceId },
      properties: {
        Day: title(session.day),
        Date: date(session.date),
        "Reminder Date": date(session.reminderDate),
        Week: select(session.week),
        Phase: select(session.phase),
        "Session Type": select(session.sessionType),
        Status: select(session.status),
        Progress: { number: session.progress },
        "Primary Topic": richText(session.primaryTopic),
        "Book Reference": richText(session.bookReference),
        "Chapter / Section": richText(session.chapterSection),
        "Page Range": richText(session.pageRange),
        "Page Reference Confidence": select(session.pageReferenceConfidence),
        "Important Concepts": richText(session.importantConcepts),
        "Derivation / Theory Task": richText(session.derivationTask),
        "Python Easy": richText(session.pythonEasy),
        "Python Medium": richText(session.pythonMedium),
        "Python Hard / Mini Project": richText(session.pythonHard),
        "DSA Topic": richText(session.dsaTopic),
        "DSA Problem": richText(session.dsaProblem),
        "Project 1 Task": richText(session.project1Task),
        "Project 2 Task": richText(session.project2Task),
        "Project 3 Task": richText(session.project3Task),
        "Interview Output": richText(session.interviewOutput),
        Hours: { number: session.hours },
        Notes: richText(session.notes),
        "Notes Upload": { files: [] },
        "Website Visible": { checkbox: session.visible !== false }
      },
      children: pageBlocks(session)
    })
  });
}

function pageBlocks(session) {
  const projectBullets = [session.project1Task, session.project2Task, session.project3Task]
    .filter(Boolean)
    .map((task) => bullet(task));
  return [
    heading("Daily Completion Checklist"),
    bullet(`Theory: ${session.chapterSection}`),
    bullet(`Derivation: ${session.derivationTask}`),
    bullet(`Python easy: ${session.pythonEasy}`),
    bullet(`Python medium: ${session.pythonMedium}`),
    bullet(`Python hard / mini project: ${session.pythonHard}`),
    bullet(`DSA: ${session.dsaProblem}`),
    heading("Project Updates"),
    ...projectBullets,
    heading("Interview Output"),
    paragraph(session.interviewOutput),
    heading("Notes Section"),
    paragraph("Add your notes, mistakes, formulas, screenshots, and links below. Attach files to the Notes Upload property when complete.")
  ];
}

function title(value) {
  return { title: [{ type: "text", text: { content: value } }] };
}

function richText(value) {
  return { rich_text: [{ type: "text", text: { content: value || "" } }] };
}

function select(value) {
  return { select: { name: value } };
}

function date(value) {
  return { date: { start: value } };
}

function heading(value) {
  return { object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: value } }] } };
}

function bullet(value) {
  return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: value } }] } };
}

function paragraph(value) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: value } }] } };
}

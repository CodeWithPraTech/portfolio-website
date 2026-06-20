import { initialData } from "./data.js";

const storeKey = "portfolio-os-data-v1";
const adminSessionKey = "portfolio-os-admin-session";
const adminSessionDurationMs = 14 * 24 * 60 * 60 * 1000;
const adminPin = "Pratik@123";
const learningSyncSource = "/api/notion/learning-playlists";
const accountUsageSource = "/api/openai/account-usage";
const statisticsProjectTitles = [
  "Stock Market Volatility and Risk Dashboard",
  "Supply Chain Delay Analysis",
  "Customer Churn Statistical Analysis"
];
const navItems = [
  ["home", "Home"],
  ["now", "Now"],
  ["about", "About"],
  ["experience", "Experience"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["learning", "Learning Progress"],
  ["dashboard", "Progress"],
  ["roadmap", "Roadmap"],
  ["research", "Research"],
  ["blogs", "Blogs"],
  ["resume", "Resume"],
  ["contact", "Contact"]
];

let data = loadData();
let learningSyncState = { status: "idle", message: "Connecting to Notion..." };
let accountUsageState = { status: "idle", message: "Checking account usage..." };
let activeFilter = "All";
let isAdmin = hasValidAdminSession();

const app = document.querySelector("#app");
const nav = document.querySelector("#nav");
const search = document.querySelector("#global-search");
const dialog = document.querySelector("#admin-dialog");

function loadData() {
  const saved = localStorage.getItem(storeKey);
  if (!saved) return structuredClone(initialData);
  try {
    const parsed = JSON.parse(saved);
    const merged = { ...structuredClone(initialData), ...parsed };
    const currentStatisticsPlaylist = initialData.learningPlaylists?.[0];
    const savedStatisticsPlaylist = parsed.learningPlaylists?.[0];

    if (currentStatisticsPlaylist) {
      const savedExtraPlaylists = savedStatisticsPlaylist?.id === currentStatisticsPlaylist.id
        ? (parsed.learningPlaylists || []).slice(1)
        : (parsed.learningPlaylists || []);
      merged.learningPlaylists = [currentStatisticsPlaylist, ...savedExtraPlaylists];
    }

    const savedProjects = parsed.projects || [];
    const statisticsProjectsReady = statisticsProjectTitles.every((title) => {
      const project = savedProjects.find((item) => item.title === title);
      const hasBusinessSprintLink = title !== "Stock Market Volatility and Risk Dashboard"
        || project?.phases?.some((phase) => phase.name === "Business Understanding" && phase.link);
      const hasDataSprintLink = title !== "Stock Market Volatility and Risk Dashboard"
        || project?.phases?.some((phase) => phase.name === "Data" && phase.link && phase.status === "In Progress");
      const hasProductConsole = title !== "Stock Market Volatility and Risk Dashboard"
        || Boolean(project?.product?.stocks?.length && project?.product?.featureRoadmap?.length);
      const hasCandlestickDetail = title !== "Stock Market Volatility and Risk Dashboard"
        || project?.product?.featureRoadmap?.some((feature) => feature.name === "Candlestick Detail" && feature.status === "Complete");
      const hasProjectWebsite = title !== "Stock Market Volatility and Risk Dashboard"
        || Boolean(project?.product?.siteUrl);
      return project?.roadmapStage === "Statistics" && hasBusinessSprintLink && hasDataSprintLink && hasProductConsole && hasCandlestickDetail && hasProjectWebsite;
    });

    if (!statisticsProjectsReady) {
      merged.projects = structuredClone(initialData.projects);
    }

    return merged;
  } catch {
    return structuredClone(initialData);
  }
}

function saveData() {
  localStorage.setItem(storeKey, JSON.stringify(data));
}

async function refreshLearningPlaylists() {
  learningSyncState = { status: "syncing", message: "Refreshing from Notion..." };
  if (route() === "learning") mount();
  const synced = await fetchSyncedLearningPlaylists();
  if (!synced.length) return;
  applyLearningPlaylistSync(synced);
  if (route() === "learning") mount();
}

async function fetchSyncedLearningPlaylists() {
  try {
    const separator = learningSyncSource.includes("?") ? "&" : "?";
    const response = await fetch(`${learningSyncSource}${separator}t=${Date.now()}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      learningSyncState = {
        status: "error",
        message: payload.error || "Live Notion sync is not connected. Add NOTION_API_KEY and run the Node dev server."
      };
      if (route() === "learning") mount();
      return [];
    }
    const playlists = Array.isArray(payload) ? payload : payload.learningPlaylists;
    if (Array.isArray(playlists) && playlists.length) {
      learningSyncState = { status: "ok", message: `Synced from Notion${payload.syncedAt ? ` at ${new Date(payload.syncedAt).toLocaleTimeString()}` : ""}` };
      return playlists;
    }
  } catch {
    learningSyncState = { status: "error", message: "Live Notion sync endpoint is unavailable. Run npm run dev with NOTION_API_KEY." };
    if (route() === "learning") mount();
  }
  return [];
}

function applyLearningPlaylistSync(syncedPlaylists) {
  const existingPlaylists = getLearningPlaylists();
  const syncedById = new Map(syncedPlaylists.map((playlist) => [playlist.id, playlist]));
  const merged = existingPlaylists.map((playlist) => {
    const syncedPlaylist = syncedById.get(playlist.id);
    if (!syncedPlaylist) return playlist;
    const syncedDaysByName = new Map((syncedPlaylist.days || []).map((day) => [day.day, day]));
    const days = (playlist.days || []).map((day) => ({ ...day, ...(syncedDaysByName.get(day.day) || {}) }));
    return { ...playlist, ...syncedPlaylist, days };
  });

  syncedPlaylists.forEach((playlist) => {
    if (!existingPlaylists.some((existing) => existing.id === playlist.id)) merged.push(playlist);
  });

  data.learningPlaylists = merged;
}

function hasValidAdminSession() {
  const session = localStorage.getItem(adminSessionKey);
  if (!session) return false;
  try {
    const parsed = JSON.parse(session);
    if (Number(parsed.expiresAt) > Date.now()) return true;
  } catch {
    // Ignore malformed sessions and clear them below.
  }
  localStorage.removeItem(adminSessionKey);
  return false;
}

function rememberAdminSession() {
  localStorage.setItem(adminSessionKey, JSON.stringify({ verifiedAt: Date.now(), expiresAt: Date.now() + adminSessionDurationMs }));
}

function clearAdminSession() {
  localStorage.removeItem(adminSessionKey);
}

function adminSessionDaysLeft() {
  const session = localStorage.getItem(adminSessionKey);
  if (!session) return 0;
  try {
    const { expiresAt } = JSON.parse(session);
    return Math.max(0, Math.ceil((Number(expiresAt) - Date.now()) / (24 * 60 * 60 * 1000)));
  } catch {
    return 0;
  }
}

function pageVisibility() {
  return { ...initialData.pageVisibility, ...(data.pageVisibility || {}) };
}

function isPublicPageVisible(pageId) {
  return pageVisibility()[pageId] !== false;
}

function isPageVisible(pageId) {
  return isAdmin || isPublicPageVisible(pageId);
}

function firstVisibleRoute() {
  return navItems.find(([id]) => isPageVisible(id))?.[0] || "home";
}

function getLearningPlaylists() {
  if (Array.isArray(data.learningPlaylists) && data.learningPlaylists.length) return data.learningPlaylists;
  if (data.statisticsRoadmap) {
    return [
      {
        id: "statistics-30-days",
        category: "Statistics",
        ...data.statisticsRoadmap
      }
    ];
  }
  return [];
}

function route() {
  const currentRoute = (location.hash.replace("#", "") || "home").split("?")[0];
  const normalizedRoute = currentRoute === "statistics" ? "learning" : currentRoute;
  return isPageVisible(normalizedRoute) ? normalizedRoute : firstVisibleRoute();
}

function routeParam(name) {
  const [, query = ""] = location.hash.split("?");
  return new URLSearchParams(query).get(name);
}

function setMeta() {
  document.title = `${data.profile.name} - Data Scientist and ML Engineer`;
  document.querySelector("[data-owner-name]").textContent = data.profile.name;
}

function renderNav() {
  nav.innerHTML = navItems
    .filter(([id]) => isPageVisible(id))
    .map(([id, label]) => {
      const hiddenFromViewers = isAdmin && !isPublicPageVisible(id);
      return `<a href="#${id}" class="${route() === id ? "active" : ""} ${hiddenFromViewers ? "hidden-from-viewers" : ""}">
        <span>${label}</span>
        ${hiddenFromViewers ? "<small>Hidden</small>" : ""}
      </a>`;
    })
    .join("");
}

function mount() {
  setMeta();
  renderNav();
  const page = route();
  const pages = {
    home,
    now,
    about,
    experience,
    skills,
    projects,
    learning,
    dashboard,
    roadmap,
    research,
    blogs,
    resume,
    contact
  };
  app.innerHTML = `${adminPageNotice(page)}${(pages[page] || home)()}`;
  document.body.classList.toggle("is-admin", isAdmin);
  document.querySelectorAll("[data-admin-status]").forEach((node) => {
    node.textContent = isAdmin ? "Verified admin" : "Viewer mode";
  });
  document.querySelectorAll("[data-page-link]").forEach((node) => {
    node.hidden = !isPageVisible(node.dataset.pageLink);
  });
  app.focus({ preventScroll: true });
  hydratePage(page);
}

function adminPageNotice(pageId) {
  if (!isAdmin) return "";
  const label = navItems.find(([id]) => id === pageId)?.[1] || pageId;
  const visible = isPublicPageVisible(pageId);
  return `
    <section class="admin-page-notice ${visible ? "public" : "private"}">
      <strong>${label}</strong>
      <span>${visible ? "Visible to viewers" : "Hidden from viewers"}</span>
      <button class="ghost-button" data-open-admin type="button">Manage Visibility</button>
    </section>`;
}

function hydratePage(page) {
  animateCounters();
  drawCharts();
  if (page === "projects") bindProjectFilters();
  if (page === "dashboard") bindProgressForm();
  if (page === "home") refreshAccountUsage();
}

async function refreshAccountUsage() {
  if (accountUsageState.status === "syncing") return;
  accountUsageState = { status: "syncing", message: "Syncing OpenAI usage..." };
  updateTokenCardMessage();
  try {
    const separator = accountUsageSource.includes("?") ? "&" : "?";
    const response = await fetch(`${accountUsageSource}${separator}t=${Date.now()}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.connected === false) {
      accountUsageState = {
        status: "error",
        message: payload.error || payload.note || "OpenAI usage is not connected."
      };
      data.tokenUsage = { ...data.tokenUsage, ...payload, liveUsageConnected: false };
      updateTokenCardMessage();
      return;
    }
    data.tokenUsage = {
      ...data.tokenUsage,
      ...payload,
      label: payload.dailyLimit ? "Daily API token usage" : "API token usage today"
    };
    accountUsageState = {
      status: "ok",
      message: payload.note || `Synced ${new Date(payload.lastUpdated).toLocaleTimeString()}`
    };
    replaceTokenCard();
  } catch {
    accountUsageState = {
      status: "error",
      message: "OpenAI usage endpoint is unavailable. Run the Node dev server with OPENAI_ADMIN_KEY."
    };
    updateTokenCardMessage();
  }
}

function replaceTokenCard() {
  const current = document.querySelector(".token-limit-card");
  if (!current) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = tokenLimitCard().trim();
  current.replaceWith(wrapper.firstElementChild);
}

function updateTokenCardMessage() {
  const node = document.querySelector("[data-token-usage-message]");
  if (node) node.textContent = accountUsageState.message;
}

function heroVisual() {
  return `
    <div class="hero-visual" aria-label="Animated AI operating system preview">
      <div class="system-window">
        <div class="window-bar"><span></span><span></span><span></span></div>
        <div class="hero-dashboard-head">
          <div>
            <p class="eyebrow">Live Learning System</p>
            <strong>Growth Console</strong>
          </div>
          <span class="live-pill">Live</span>
        </div>
        <div class="signal-grid">
          ${data.roadmap.slice(0, 6).map((item) => `<div><strong>${item.progress}%</strong><span>${item.stage}</span></div>`).join("")}
        </div>
        <div class="hero-bars">
          ${data.skills.slice(0, 8).map((skill, index) => `
            <div class="hero-bar" style="--value:${skill.level}%; --delay:${index * 0.12}s">
              <span>${skill.name}</span>
              <strong>${skill.level}%</strong>
              <i></i>
            </div>`).join("")}
        </div>
        <div class="number-stream">
          ${data.progress.slice(-6).map((entry) => `
            <div><span>${entry.hours}h</span><small>${entry.tasks} tasks</small></div>`).join("")}
        </div>
        <canvas class="mini-chart" data-chart="hours"></canvas>
      </div>
    </div>`;
}

function home() {
  return `
    <section class="hero section">
      <div class="hero-copy">
        <p class="eyebrow">Personal AI Operating System</p>
        <h1>${data.profile.name}</h1>
        <h2>${data.profile.title}</h2>
        <p class="hero-text">${data.profile.mission}</p>
        <div class="hero-actions">
          <a class="primary-button" href="#projects">Explore Work</a>
          <a class="secondary-button" href="#dashboard">View Progress</a>
          <a class="ghost-button" href="#contact">Collaborate</a>
        </div>
      </div>
      ${heroVisual()}
    </section>
    <section class="stats-strip">${data.stats.map(statCard).join("")}</section>
    ${tokenLimitCard()}
    <section class="two-col section">
      <div>
        <p class="eyebrow">Current Signal</p>
        <h2>Actively learning, shipping, and turning business ambiguity into AI systems.</h2>
      </div>
      <div class="feature-grid">
        ${[
          ["Build in Public", "Daily logs, project milestones, experiments, and honest progress signals."],
          ["Business Fluency", "Close work with stakeholders to define problems, measure outcomes, and deploy useful solutions."],
          ["Learning Velocity", "Roadmaps, research notes, reading progress, and consistency analytics."],
          ["Production Mindset", "Architecture, metrics, lessons learned, deployment notes, and system tradeoffs."]
        ].map(featureCard).join("")}
      </div>
    </section>
    ${aiInsights()}
    ${latestProgress()}
  `;
}

function tokenLimitCard() {
  const usage = data.tokenUsage || {};
  const connected = usage.liveUsageConnected === true;
  const limit = Number(usage.dailyLimit || 0);
  const used = Math.max(0, Number(usage.usedToday || 0));
  const remaining = Math.max(0, limit - used);
  const hasUsage = connected && Number.isFinite(Number(usage.usedToday));
  const hasLimit = hasUsage && limit > 0;
  const percent = hasLimit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const status = hasLimit
    ? (percent >= 90 ? "High usage" : percent >= 70 ? "Watch usage" : "Healthy")
    : hasUsage ? "Usage synced" : "Subscription active";
  const cost = usage.cost?.value != null
    ? `${String(usage.cost.currency || "usd").toUpperCase()} ${Number(usage.cost.value || 0).toFixed(4)}`
    : "Unavailable";
  return `
    <section class="token-limit-card section ${hasLimit ? "" : "not-connected"}" aria-label="Account subscription and token usage">
      <div>
        <p class="eyebrow">${usage.provider || "Account Usage"}</p>
        <h2>${usage.label || "Account subscription status"}</h2>
        <p>${hasUsage
          ? "Live API usage is connected. Remaining and percent need a configured daily token limit."
          : "Your plan can be shown here, but exact daily quota usage is not connected because the provider does not expose it to this local website."}</p>
      </div>
      <div class="token-meter">
        <div class="token-meter-head">
          <span>${status}</span>
          <strong>${hasLimit ? `${percent}% used` : hasUsage ? `${formatNumber(used)} tokens` : usage.plan || "Pro"}</strong>
        </div>
        <div class="token-progress" style="--token-used:${percent}%"><i></i></div>
        <div class="token-metrics">
          <span><small>Used today</small><strong>${hasUsage ? formatNumber(used) : "Not connected"}</strong></span>
          <span><small>Cost today</small><strong>${hasUsage ? cost : "Unavailable"}</strong></span>
          <span><small>Requests</small><strong>${hasUsage ? formatNumber(usage.requests || 0) : "Unavailable"}</strong></span>
          <span><small>${hasLimit ? "Remaining" : "Daily limit"}</small><strong>${hasLimit ? formatNumber(remaining) : "Not exposed"}</strong></span>
        </div>
        <p class="token-updated" data-token-usage-message>${accountUsageState.message || usage.lastUpdated || "Live account quota is not connected"}</p>
      </div>
    </section>`;
}

function now() {
  return `
    <section class="section page-head">
      <p class="eyebrow">Now</p>
      <h1>What I am focused on right now</h1>
      <p>${data.profile.summary}</p>
    </section>
    <section class="bento">
      ${Object.entries({
        "Learning": data.now.learning,
        "Building": data.now.building,
        "Reading": data.now.reading,
        "Research": data.now.research,
        "Focus Area": data.now.focus
      }).map(([title, body]) => `<article class="panel"><p class="eyebrow">${title}</p><h3>${body}</h3></article>`).join("")}
      <article class="panel wide"><p class="eyebrow">Current Goals</p><div class="checklist">${data.now.goals.map((g) => `<span>${g}</span>`).join("")}</div></article>
    </section>`;
}

function about() {
  return `
    <section class="section page-head">
      <p class="eyebrow">About Me</p>
      <h1>Data scientist with a builder's bias and a business translator's ear.</h1>
      <p>${data.profile.summary}</p>
    </section>
    <section class="two-col section">
      <article class="panel">
        <h2>How I Work</h2>
        <p>I work closely with business teams to understand the real problem, clarify the decision that needs to improve, and build data or ML solutions that are usable beyond a notebook.</p>
      </article>
      <article class="panel">
        <h2>Achievements</h2>
        <ul class="clean-list">${data.achievements.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
    </section>
    <section class="section">${education()}</section>`;
}

function education() {
  return `<div class="timeline">${data.education.map((item) => `
    <article class="timeline-item">
      <span></span>
      <div><p class="eyebrow">${item.period}</p><h3>${item.degree}</h3><strong>${item.institute}</strong><p>${item.details}</p></div>
    </article>`).join("")}</div>`;
}

function experience() {
  return `
    <section class="section page-head"><p class="eyebrow">Experience</p><h1>Professional experience grounded in business problem solving.</h1></section>
    <section class="timeline">${data.experience.map((job) => {
      const designation = job.designation || job.role || "Role title";
      const meta = [job.company, job.location, job.employmentType].filter(Boolean).join(" - ");
      return `
      <article class="timeline-item">
        <span></span>
        <div>
          <p class="eyebrow">${job.isCurrent ? "Current Role" : "Experience"} - ${job.period || "Period to be updated"}</p>
          <h2>${designation}</h2>
          <strong>${meta || "Company details to be updated"}</strong>
          ${job.businessFocus ? `<p>${job.businessFocus}</p>` : ""}
          <ul class="clean-list">${(job.highlights || []).map((h) => `<li>${h}</li>`).join("")}</ul>
        </div>
      </article>`;
    }).join("")}</section>`;
}

function skills() {
  const groups = groupBy(data.skills, "group");
  return `
    <section class="section page-head"><p class="eyebrow">Skills</p><h1>Technical depth with business-facing execution.</h1></section>
    <section class="skill-groups">${Object.entries(groups).map(([group, skills]) => `
      <article class="panel">
        <h2>${group}</h2>
        ${skills.map((skill) => progressLine(skill.name, skill.level)).join("")}
      </article>`).join("")}</section>`;
}

function projects() {
  const roadmapFilter = routeParam("roadmap");
  const baseProjects = roadmapFilter
    ? data.projects.filter((p) => p.roadmapStage === roadmapFilter)
    : data.projects;
  const categories = ["All", ...new Set(baseProjects.map((p) => p.category))];
  const selectedFilter = categories.includes(activeFilter) ? activeFilter : "All";
  const projects = selectedFilter === "All"
    ? baseProjects
    : baseProjects.filter((p) => p.category === selectedFilter || p.stack.join(" ").includes(selectedFilter));
  return `
    <section class="section page-head">
      <p class="eyebrow">Projects</p>
      <h1>${roadmapFilter ? `${roadmapFilter} project lane.` : "Projects built as business decision systems."}</h1>
      <p>${roadmapFilter ? `Showing projects connected to the ${roadmapFilter} roadmap stage.` : "Each project follows the same path: Business Understanding -> Data -> Analytics -> Information -> Decision Making -> Intervention."}</p>
    </section>
    ${roadmapProjectTabs(roadmapFilter)}
    <div class="filter-row">${categories.map((c) => `<button class="${selectedFilter === c ? "active" : ""}" data-filter="${c}">${c}</button>`).join("")}</div>
    ${projects.length
      ? `<section class="project-grid">${projects.map(projectCard).join("")}</section>`
      : emptyProjectLane(roadmapFilter)}`;
}

function learning() {
  const playlists = getLearningPlaylists();
  const activePlaylist = playlists[0];
  const visibleDays = activePlaylist.days.filter((day) => day.visible !== false);
  const pending = visibleDays.filter((day) => normalizeStatus(day.status) === "pending").length;
  const inProgress = visibleDays.filter((day) => normalizeStatus(day.status) === "in progress").length;
  const completed = visibleDays.filter((day) => normalizeStatus(day.status) === "complete").length;
  const totalProgress = Math.round(sum(visibleDays.map(sessionProgress)) / Math.max(visibleDays.length, 1));
  return `
    <section class="section page-head">
      <p class="eyebrow">Learning Progress</p>
      <h1>${activePlaylist.title}</h1>
      <p>${activePlaylist.description}</p>
      <div class="hero-actions">
        <a class="primary-button" href="${activePlaylist.notionDatabaseUrl}" target="_blank" rel="noreferrer">Open Active Playlist</a>
        <a class="secondary-button" href="#roadmap">Main AI Roadmap</a>
      </div>
    </section>
    <section class="playlist-grid">
      ${playlists.map((playlist, index) => {
        const playlistDays = playlist.days.filter((day) => day.visible !== false);
        const playlistProgress = Math.round(sum(playlistDays.map(sessionProgress)) / Math.max(playlistDays.length, 1));
        return `
          <article class="playlist-card ${index === 0 ? "active" : ""}">
            <p class="eyebrow">${playlist.category || "Study Playlist"}</p>
            <h2>${playlist.title}</h2>
            <p>${playlist.description}</p>
            ${progressLine("Average progress", playlistProgress)}
            <div class="tags"><span>${playlistDays.length} sessions</span><span>${playlist.status}</span></div>
          </article>`;
      }).join("")}
    </section>
    <section class="stats-strip">
      ${statCard({ label: "Total sessions", value: visibleDays.length, suffix: "" })}
      ${statCard({ label: "Pending", value: pending, suffix: "" })}
      ${statCard({ label: "In progress", value: inProgress, suffix: "" })}
      ${statCard({ label: "Complete", value: completed, suffix: "" })}
      ${statCard({ label: "Average progress", value: totalProgress, suffix: "%" })}
    </section>
    <section class="panel notion-source">
      <div>
        <p class="eyebrow">${activePlaylist.status}</p>
        <h2>Notion is the source of truth</h2>
        <p>Active playlist: ${activePlaylist.title}</p>
        <p>Database ID: ${activePlaylist.notionDataSourceId}</p>
        <p class="sync-message ${learningSyncState.status}">${learningSyncState.message}</p>
      </div>
      <a class="ghost-button" href="${activePlaylist.notionDatabaseUrl}" target="_blank" rel="noreferrer">View Database</a>
    </section>
    <section class="stats-roadmap-grid">
      ${visibleDays.map((day) => `
        <article class="stats-day-card ${String(day.sessionType || "").toLowerCase()}">
          <div class="panel-head">
            <h3>${day.day}</h3>
            <span class="status-badge ${normalizeStatus(day.status).replaceAll(" ", "-")}">${day.status}</span>
          </div>
          <div class="tags compact-tags"><span>${day.sessionType || "Core"}</span><span>${day.week || "Week"}</span><span>${formatDate(day.date)}</span></div>
          <h2>${day.focusArea}</h2>
          ${progressLine("Progress", sessionProgress(day))}
          <dl class="session-details">
            <dt>Reminder</dt><dd>${day.reminderDate ? formatDate(day.reminderDate) : "Set in Notion"}</dd>
            <dt>Resources</dt><dd>${day.resources || "Reference to be added"}</dd>
            <dt>Important concepts</dt><dd>${day.importantConcepts || "Concepts to be added"}</dd>
            <dt>Practice</dt><dd>${day.practiceQuestions || day.tasks}</dd>
            <dt>Notes</dt><dd>${day.notesUpload ? `<a href="${day.notesUpload}" target="_blank" rel="noreferrer">Open uploaded notes</a>` : "Upload notes in Notion after completing this topic."}</dd>
          </dl>
          <p>${day.tasks}</p>
        </article>`).join("")}
    </section>`;
}

function dashboard() {
  const totalHours = sum(data.progress.map((p) => p.hours));
  const totalTasks = sum(data.progress.map((p) => p.tasks));
  const consistency = Math.round((data.progress.length / 30) * 100);
  return `
    <section class="section page-head">
      <p class="eyebrow">Daily Progress Dashboard</p>
      <h1>Build in public and learn in public, tracked as a living system.</h1>
    </section>
    <section class="stats-strip">
      ${statCard({ label: "Logged hours", value: totalHours, suffix: "" })}
      ${statCard({ label: "Tasks completed", value: totalTasks, suffix: "" })}
      ${statCard({ label: "Consistency score", value: Math.min(consistency, 100), suffix: "%" })}
      ${statCard({ label: "Latest project progress", value: data.progress.at(-1)?.project || 0, suffix: "%" })}
    </section>
    <section class="dashboard-grid">
      <article class="panel wide"><div class="panel-head"><h2>Contribution Heatmap</h2><span>${data.progress.length} active days</span></div><div class="heatmap">${heatmap()}</div></article>
      <article class="panel"><div class="panel-head"><h2>Study Hours</h2><span>recent logs</span></div><canvas data-chart="hours"></canvas></article>
      <article class="panel"><div class="panel-head"><h2>Project Progress</h2><span>trajectory</span></div><canvas data-chart="project"></canvas></article>
      <article class="panel wide">${progressForm()}</article>
    </section>
    ${latestProgress()}`;
}

function roadmap() {
  const stages = roadmapStages();
  return `
    <section class="section page-head">
      <p class="eyebrow">Main AI Roadmap</p>
      <h1>Topic flow path from statistics to production AI systems.</h1>
      <p>This view only tracks the status of each component. Detailed daily plans live inside Learning Progress.</p>
    </section>
    <section class="roadmap-flow" aria-label="Main AI roadmap flow">
      ${stages.map((item, index) => `
        <a class="roadmap-node ${roadmapStatusClass(item.status)}" href="#projects?roadmap=${encodeURIComponent(item.stage)}">
          <span class="roadmap-index">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h2>${item.stage}</h2>
            <strong>${item.status}</strong>
            <p>${projectCountForStage(item.stage)} project${projectCountForStage(item.stage) === 1 ? "" : "s"} linked</p>
          </div>
          <span class="roadmap-cta">View projects</span>
        </a>
        ${index < stages.length - 1 ? `<span class="roadmap-arrow" aria-hidden="true"></span>` : ""}
      `).join("")}
    </section>`;
}

function research() {
  return `
    <section class="section page-head"><p class="eyebrow">Research and Reading Tracker</p><h1>Books, papers, courses, articles, and certifications.</h1></section>
    <section class="reading-grid">${data.reading.map((item) => `
      <article class="panel reading-card">
        <div class="panel-head"><h2>${item.title}</h2><span>${item.type}</span></div>
        <p>${item.author}</p>
        ${progressLine(item.status, item.progress)}
      </article>`).join("")}</section>`;
}

function blogs() {
  return `
    <section class="section page-head"><p class="eyebrow">Blog</p><h1>Technical articles, project breakdowns, learning notes, and career lessons.</h1></section>
    <section class="blog-list">${data.blogs.map((post) => `
      <article class="blog-card">
        <p class="eyebrow">${post.type} - ${post.readTime}</p>
        <h2>${post.title}</h2>
        <p>${post.summary}</p>
        <span>${formatDate(post.date)}</span>
      </article>`).join("")}</section>`;
}

function resume() {
  return `
    <section class="section page-head"><p class="eyebrow">Resume</p><h1>Snapshot for recruiters, founders, and collaborators.</h1></section>
    <section class="resume-layout">
      <article class="panel"><h2>${data.profile.title}</h2><p>${data.profile.summary}</p><a class="primary-button" href="${data.profile.resumeUrl}">Download Resume</a></article>
      <article class="panel"><h2>Core Signal</h2>${data.skills.slice(0, 6).map((s) => progressLine(s.name, s.level)).join("")}</article>
    </section>`;
}

function contact() {
  return `
    <section class="section page-head"><p class="eyebrow">Contact</p><h1>Open to AI, data science, analytics, and business problem-solving collaborations.</h1></section>
    <section class="contact-grid">
      <a class="contact-card" href="mailto:${data.profile.email}"><span>Email</span><strong>${data.profile.email}</strong></a>
      ${Object.entries(data.profile.socials).map(([name, url]) => `<a class="contact-card" href="${url}" target="_blank" rel="noreferrer"><span>${name}</span><strong>${url.replace("https://", "")}</strong></a>`).join("")}
    </section>`;
}

function statCard(stat) {
  return `<article class="stat-card"><strong data-count="${stat.value}">0</strong><span>${stat.suffix}</span><p>${stat.label}</p></article>`;
}

function featureCard([title, body]) {
  return `<article class="feature-card"><h3>${title}</h3><p>${body}</p></article>`;
}

function projectCard(project) {
  return `
    <article class="project-card">
      <div class="project-shot"><span>${project.category}</span><div></div><div></div><div></div></div>
      <div class="project-body">
        <div class="panel-head"><h2>${project.title}</h2><span>${project.status}</span></div>
        <p>${project.overview}</p>
        ${project.phases ? projectPhases(project.phases) : ""}
        <dl>
          <dt>Problem</dt><dd>${project.problem}</dd>
          <dt>Dataset</dt><dd>${project.dataset}</dd>
          <dt>Architecture</dt><dd>${project.architecture}</dd>
          <dt>Key metrics</dt><dd>${project.metrics}</dd>
          <dt>Lessons</dt><dd>${project.lessons}</dd>
        </dl>
        <div class="tags">${project.stack.map((s) => `<span>${s}</span>`).join("")}</div>
        ${projectActions(project)}
      </div>
    </article>`;
}

function projectActions(project) {
  const projectWebsiteUrl = project.product?.siteUrl || project.demo;
  const primaryLabel = project.product ? "Open Project Website" : "Demo";
  return `<div class="button-row"><a class="secondary-button" href="${projectWebsiteUrl}" ${project.product ? "" : 'target="_blank" rel="noreferrer"'}>${primaryLabel}</a><a class="ghost-button" href="${project.github}" target="_blank" rel="noreferrer">GitHub</a>${project.notion ? `<a class="ghost-button" href="${project.notion}" target="_blank" rel="noreferrer">Notion Timeline</a>` : ""}</div>`;
}

function roadmapProjectTabs(activeStage) {
  const stages = roadmapStages();
  return `<div class="roadmap-project-tabs">
    <a class="${!activeStage ? "active" : ""}" href="#projects">All</a>
    ${stages.map((stage) => `<a class="${activeStage === stage.stage ? "active" : ""}" href="#projects?roadmap=${encodeURIComponent(stage.stage)}">${stage.stage}</a>`).join("")}
  </div>`;
}

function emptyProjectLane(stage) {
  return `
    <section class="panel empty-project-lane">
      <p class="eyebrow">Upcoming Project Lane</p>
      <h2>${stage || "This"} projects will appear here.</h2>
      <p>Once you start this roadmap stage, add projects with <strong>roadmapStage: "${stage || "Stage Name"}"</strong> and they will show in this section automatically.</p>
    </section>`;
}

function projectPhases(phases) {
  return `<div class="project-phase-flow">${phases.map((phase, index) => {
    const tag = phase.link ? "a" : "div";
    const linkAttrs = phase.link ? ` href="${phase.link}" target="_blank" rel="noreferrer"` : "";
    return `
    <${tag} class="project-phase ${roadmapStatusClass(phase.status)} ${phase.link ? "clickable" : ""}"${linkAttrs}>
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div>
        <strong>${phase.name}</strong>
        <small>${phase.status}</small>
        <p>${phase.summary}</p>
        ${phase.link ? `<em>${phase.linkLabel || "Open details"}</em>` : ""}
      </div>
    </${tag}>
  `;
  }).join("")}</div>`;
}

function progressLine(label, value) {
  return `<div class="progress-line"><div><span>${label}</span><strong>${value}%</strong></div><progress max="100" value="${value}"></progress></div>`;
}

function heatmap() {
  const byDate = Object.fromEntries(data.progress.map((p) => [p.date, p]));
  const today = new Date("2026-06-06T00:00:00");
  return Array.from({ length: 70 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (69 - index));
    const key = day.toISOString().slice(0, 10);
    const entry = byDate[key];
    const level = entry ? Math.min(4, Math.ceil(entry.hours)) : 0;
    return `<button class="heat level-${level}" title="${key}: ${entry ? `${entry.hours} hours, ${entry.tasks} tasks` : "No log"}"></button>`;
  }).join("");
}

function progressForm() {
  return `
    <div class="panel-head"><h2>Add Daily Log</h2><span>stored locally</span></div>
    <form id="progress-form" class="log-form">
      <input name="date" type="date" required value="2026-06-06" />
      <input name="tasks" type="number" min="0" placeholder="Tasks completed" required />
      <input name="hours" type="number" min="0" step="0.25" placeholder="Hours studied" required />
      <input name="topics" placeholder="Topics learned, comma separated" required />
      <input name="project" type="number" min="0" max="100" placeholder="Project progress %" required />
      <input name="weeklyGoal" placeholder="Weekly goal" />
      <input name="monthlyGoal" placeholder="Monthly goal" />
      <textarea name="notes" placeholder="Notes and insights"></textarea>
      <button class="primary-button">Save Log</button>
    </form>`;
}

function latestProgress() {
  return `<section class="section"><div class="panel-head"><div><p class="eyebrow">Public Learning Log</p><h2>Recent daily updates</h2></div><a href="#dashboard">Open dashboard</a></div><div class="log-list">${data.progress.slice(-5).reverse().map((log) => `
    <article class="log-card"><span>${formatDate(log.date)}</span><h3>${log.topics.join(", ")}</h3><p>${log.notes}</p><div class="tags"><span>${log.hours}h</span><span>${log.tasks} tasks</span><span>${log.project}% project</span></div></article>`).join("")}</div></section>`;
}

function aiInsights() {
  const weakest = [...data.skills].sort((a, b) => a.level - b.level).slice(0, 3);
  const strongest = [...data.skills].sort((a, b) => b.level - a.level).slice(0, 3);
  return `<section class="section"><p class="eyebrow">AI-Powered Insights</p><div class="insight-grid">
    <article class="panel"><h2>Personalized Career Summary</h2><p>${data.profile.summary} Current strongest signals: ${strongest.map((s) => s.name).join(", ")}.</p></article>
    <article class="panel"><h2>Learning Recommendations</h2><p>Prioritize ${weakest.map((s) => s.name).join(", ")} next, then connect each topic to one public case study and one business metric.</p></article>
    <article class="panel"><h2>Project Recommendation</h2><p>Build a production RAG analytics copilot with evaluation dashboards, cost monitoring, and a stakeholder-facing demo.</p></article>
  </div></section>`;
}

function bindProjectFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      mount();
    });
  });
}

function bindProgressForm() {
  const form = document.querySelector("#progress-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    data.progress.push({
      date: formData.get("date"),
      tasks: Number(formData.get("tasks")),
      hours: Number(formData.get("hours")),
      topics: String(formData.get("topics")).split(",").map((x) => x.trim()).filter(Boolean),
      project: Number(formData.get("project")),
      notes: formData.get("notes") || "Logged progress.",
      weeklyGoal: formData.get("weeklyGoal") || "",
      monthlyGoal: formData.get("monthlyGoal") || ""
    });
    saveData();
    mount();
  });
}

function animateCounters() {
  document.querySelectorAll("[data-count]").forEach((node) => {
    const target = Number(node.dataset.count);
    let current = 0;
    const steps = 28;
    const timer = setInterval(() => {
      current += target / steps;
      if (current >= target) {
        node.textContent = Number.isInteger(target) ? target : target.toFixed(1);
        clearInterval(timer);
      } else {
        node.textContent = Number.isInteger(target) ? Math.floor(current) : current.toFixed(1);
      }
    }, 24);
  });
}

function drawCharts() {
  document.querySelectorAll("canvas[data-chart]").forEach((canvas) => {
    const metric = canvas.dataset.chart;
    const values = data.progress.slice(-10).map((p) => metric === "project" ? p.project : p.hours);
    const ctx = canvas.getContext("2d");
    const width = canvas.width = canvas.clientWidth * devicePixelRatio;
    const height = canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const w = width / devicePixelRatio;
    const h = height / devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 4) * i);
      ctx.lineTo(w, (h / 4) * i);
      ctx.stroke();
    }
    const max = Math.max(...values, 1);
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = (w / Math.max(values.length - 1, 1)) * index;
      const y = h - (value / max) * (h - 18) - 9;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "#24d1a7");
    gradient.addColorStop(0.55, "#8b7dff");
    gradient.addColorStop(1, "#ffcc66");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

function bindAdmin() {
  const login = document.querySelector("#admin-login");
  const logout = document.querySelector("#admin-logout");
  const pin = document.querySelector("#admin-pin");
  const message = document.querySelector("#admin-message");
  const editor = document.querySelector(".admin-editor");
  const collection = document.querySelector("#admin-collection");
  const json = document.querySelector("#admin-json");
  const visibilityControls = document.querySelector("#page-visibility-controls");
  const editable = ["profile", "tokenUsage", "pageVisibility", "now", "education", "experience", "skills", "projects", "blogs", "roadmap", "learningPlaylists", "progress", "reading", "achievements"];
  collection.innerHTML = editable.map((key) => `<option>${key}</option>`).join("");
  const sync = () => json.value = JSON.stringify(data[collection.value], null, 2);
  const setAdminUi = (statusMessage) => {
    isAdmin = hasValidAdminSession();
    editor.hidden = !isAdmin;
    login.hidden = isAdmin;
    logout.hidden = !isAdmin;
    pin.hidden = isAdmin;
    message.textContent = statusMessage || (isAdmin
      ? `Admin already verified. Session remains for about ${adminSessionDaysLeft()} day(s).`
      : "Verification required before editing the site.");
    renderVisibilityControls();
    if (isAdmin) sync();
  };
  const renderVisibilityControls = () => {
    if (!visibilityControls) return;
    const visibility = pageVisibility();
    visibilityControls.innerHTML = navItems
      .map(([id, label]) => `
        <label class="visibility-toggle">
          <input type="checkbox" data-page-visibility="${id}" ${visibility[id] !== false ? "checked" : ""} />
          <span>${label}</span>
          <small>${visibility[id] !== false ? "Public" : "Hidden"}</small>
        </label>`)
      .join("");
    visibilityControls.querySelectorAll("[data-page-visibility]").forEach((input) => {
      input.addEventListener("change", () => {
        data.pageVisibility = { ...pageVisibility(), [input.dataset.pageVisibility]: input.checked };
        saveData();
        if (collection.value === "pageVisibility") sync();
        mount();
      });
    });
  };
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-open-admin]")) return;
    isAdmin = hasValidAdminSession();
    setAdminUi();
    dialog.showModal();
  });
  collection.addEventListener("change", sync);
  login.addEventListener("click", (event) => {
    event.preventDefault();
    if (pin.value === adminPin) {
      isAdmin = true;
      rememberAdminSession();
      pin.value = "";
      setAdminUi("Admin verified. Full editing permissions enabled for 2 weeks.");
      mount();
    } else {
      message.textContent = "Verification failed. Enter the correct admin password.";
      pin.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }], 180);
    }
  });
  logout.addEventListener("click", () => {
    isAdmin = false;
    clearAdminSession();
    setAdminUi("Admin mode ended. You are back in viewer mode.");
    mount();
  });
  document.querySelector("#admin-save").addEventListener("click", () => {
    try {
      if (!isAdmin) return;
      data[collection.value] = JSON.parse(json.value);
      saveData();
      renderVisibilityControls();
      mount();
    } catch (error) {
      alert(`Invalid JSON: ${error.message}`);
    }
  });
  document.querySelector("#admin-reset").addEventListener("click", () => {
    if (!isAdmin) return;
    data = structuredClone(initialData);
    saveData();
    sync();
    renderVisibilityControls();
    mount();
  });
  setAdminUi();
}

function bindSearch() {
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    if (!q) return;
    const haystack = [
      ...data.projects.map((p) => ["projects", p.title, p.overview, p.category].join(" ")),
      ...data.skills.map((s) => ["skills", s.name, s.group].join(" ")),
      ...data.blogs.map((b) => ["blogs", b.title, b.summary].join(" ")),
      ...data.progress.map((p) => ["dashboard", p.topics.join(" "), p.notes].join(" "))
    ];
    const match = haystack.find((item) => item.toLowerCase().includes(q));
    if (match) location.hash = `#${match.split(" ")[0]}`;
  });
}

function ambientCanvas() {
  const canvas = document.querySelector("#ambient-canvas");
  const ctx = canvas.getContext("2d");
  let t = 0;
  function resize() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  function frame() {
    t += 0.006;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < 70; i++) {
      const x = (Math.sin(t + i) * 0.5 + 0.5) * innerWidth;
      const y = (Math.cos(t * 0.8 + i * 1.7) * 0.5 + 0.5) * innerHeight;
      ctx.fillStyle = i % 3 === 0 ? "rgba(36,209,167,.12)" : i % 3 === 1 ? "rgba(139,125,255,.1)" : "rgba(255,204,102,.08)";
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  addEventListener("resize", resize);
  resize();
  frame();
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    (acc[item[key]] ||= []).push(item);
    return acc;
  }, {});
}

function sum(values) {
  return values.reduce((a, b) => a + b, 0);
}

function roadmapStages() {
  const stages = data.roadmap.map((item) => ({ stage: item.stage, status: item.status || "Pending" }));
  const statisticsPlaylist = getLearningPlaylists().find((playlist) => playlist.id === "statistics-advanced-45-sessions");
  const statisticsDays = statisticsPlaylist?.days?.filter((day) => day.visible !== false) || [];
  const statisticsComplete = statisticsDays.length > 0 && statisticsDays.every((day) => normalizeStatus(day.status) === "complete");

  return stages.map((item, index) => {
    if (index === 0) return { ...item, status: statisticsComplete ? "Complete" : "In Progress" };
    if (index === 1) return { ...item, status: statisticsComplete ? "In Progress" : "Next" };
    return { ...item, status: item.status === "Complete" ? "Complete" : "Pending" };
  });
}

function projectCountForStage(stage) {
  return data.projects.filter((project) => project.roadmapStage === stage).length;
}

function roadmapStatusClass(status) {
  return normalizeStatus(status).replaceAll(" ", "-");
}

function normalizeStatus(status) {
  const normalized = String(status || "Pending").toLowerCase();
  if (normalized === "completed") return "complete";
  if (normalized === "to plan" || normalized === "planned") return "pending";
  return normalized;
}

function sessionProgress(day) {
  if (normalizeStatus(day.status) === "complete") return Math.max(Number(day.progress) || 0, 100);
  return Number(day.progress) || 0;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
    minimumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
}

function formatSigned(value) {
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Math.abs(value));
  return `${value >= 0 ? "+" : "-"}${formatted}`;
}

function formatPercent(value) {
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Math.abs(value));
  return `${value >= 0 ? "+" : "-"}${formatted}%`;
}

addEventListener("hashchange", mount);
bindAdmin();
bindSearch();
ambientCanvas();
mount();
refreshLearningPlaylists();

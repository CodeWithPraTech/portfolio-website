let lookback = "6mo";

const status = document.querySelector("#status");
const latestDate = document.querySelector("#latest-date");
const rowCount = document.querySelector("#row-count");
const symbolCount = document.querySelector("#symbol-count");
const qualityIssues = document.querySelector("#quality-issues");
const stockGrid = document.querySelector("#stock-grid");
const buttons = document.querySelectorAll("[data-lookback]");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    lookback = button.dataset.lookback;
    buttons.forEach((item) => item.classList.toggle("active", item === button));
    refreshDashboard();
  });
});

refreshDashboard();

async function refreshDashboard() {
  status.textContent = `Refreshing ${lookback === "1y" ? "1 year" : "6 months"} of latest numbers...`;
  stockGrid.innerHTML = "";

  try {
    const response = await fetch(`/api/dashboard-summary?lookback=${lookback}&t=${Date.now()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || payload.status !== "ok") {
      throw new Error(payload.message || "Refresh failed");
    }
    renderSummary(payload);
  } catch (error) {
    status.textContent = error.message || "Could not refresh latest numbers.";
  }
}

function renderSummary(payload) {
  status.textContent = `Updated ${formatDateTime(payload.refreshedAt)}. Showing ${payload.lookback === "1y" ? "1 year" : "6 months"}.`;
  latestDate.textContent = payload.latestDate || "-";
  rowCount.textContent = formatNumber(payload.rowCount);
  symbolCount.textContent = formatNumber(payload.symbolCount);
  qualityIssues.textContent = formatNumber(payload.qualityIssues);
  stockGrid.innerHTML = payload.stocks.map(renderStockCard).join("");
}

function renderStockCard(stock) {
  const moveTone = Number(stock.dayChangePct) >= 0 ? "positive" : "negative";
  const windowTone = Number(stock.windowChangePct) >= 0 ? "positive" : "negative";
  return `
    <article class="stock-card">
      <div>
        <span>${stock.symbol}</span>
        <h2>${stock.name}</h2>
        <p>${stock.sector || "Sector not set"} · ${stock.industry || "Industry not set"}</p>
        <p>${stock.rows || 0} recent rows · ${stock.latestDate || "No date"}</p>
      </div>
      <div class="stock-numbers">
        <div>
          <span>Latest close</span>
          <strong>${formatCurrency(stock.latestClose)}</strong>
        </div>
        <div>
          <span>Today</span>
          <strong class="${moveTone}">${formatSigned(stock.dayChange)} (${formatPercent(stock.dayChangePct)})</strong>
        </div>
        <div>
          <span>Window move</span>
          <strong class="${windowTone}">${formatPercent(stock.windowChangePct)}</strong>
        </div>
        <div>
          <span>Volume vs avg</span>
          <strong>${stock.volumeVsAverage ? `${stock.volumeVsAverage}x` : "-"}</strong>
        </div>
      </div>
    </article>`;
}

function formatDateTime(value) {
  if (!value) return "now";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatSigned(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : "-"}${Math.abs(number).toFixed(2)}`;
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : "-"}${Math.abs(number).toFixed(2)}%`;
}

"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Info,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Candle = [string, number, number, number, number, number];

type Stock = {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  latestDate: string;
  latestClose: number;
  dayChangePct: number | null;
  weekChangePct: number | null;
  monthChangePct: number | null;
  quarterChangePct: number | null;
  yearChangePct: number | null;
  volatility: number | null;
  maxDrawdown1y: number | null;
  maxDrawdown3y: number | null;
  currentDrawdown: number | null;
  beta: number | null;
  correlation: number | null;
  valueAtRisk95: number | null;
  expectedShortfall95: number | null;
  atr14: number | null;
  atrPct: number | null;
  averageValue20d: number | null;
  volumeRatio: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  dataPoints: number;
  riskScore: number;
  riskLevel: "Lower" | "Moderate" | "Higher";
  signalScore: number;
  signal: "Favorable" | "Watch" | "Caution";
  signals: {
    priceAbove50d: boolean;
    fiftyAbove200d: boolean;
    positiveMonth: boolean;
    positiveQuarter: boolean;
    beatsMarketQuarter: boolean;
  };
  candles: Candle[];
  intraday: Candle[];
  corporateActions: {
    date: string;
    type: string;
    dividend: number | null;
    splitRatio: string | null;
  }[];
};

type DashboardData = {
  meta: {
    generatedAt: string;
    latestMarketDate: string;
    dailyRows: number;
    intradayRows: number;
    stockCount: number;
    qualityIssues: number;
    dailyRange: [string, string];
    disclaimer: string;
  };
  market: {
    latestClose: number;
    dayChangePct: number;
    monthChangePct: number;
    yearChangePct: number;
    advancers: number;
    decliners: number;
    higherRisk: number;
    moderateRisk: number;
    lowerRisk: number;
  };
  sectors: {
    sector: string;
    stocks: number;
    averageRisk: number;
    averageVolatility: number;
    monthChangePct: number;
  }[];
  stocks: Stock[];
};

type Answer = {
  title: string;
  summary: string;
  what: string;
  why: string[];
  how: string[];
  stock?: Stock;
};

type LiveQuote = {
  status: "ok";
  symbol: string;
  price: number;
  changePct: number | null;
  marketTime: string;
  delayed: boolean;
};

const examples = [
  "Why is Reliance risky?",
  "What do the signals say about TCS?",
  "How should I size HDFC Bank?",
  "Compare Infosys with Wipro",
];

const riskColors = {
  Lower: "#138a72",
  Moderate: "#b7791f",
  Higher: "#c64b4b",
};

const signalColors = {
  Favorable: "#138a72",
  Watch: "#b7791f",
  Caution: "#c64b4b",
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "sectors" | "method">("overview");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sortBy, setSortBy] = useState("riskScore");
  const [chartWindow, setChartWindow] = useState("1Y");
  const [chartMode, setChartMode] = useState<"daily" | "30m">("daily");
  const [portfolio, setPortfolio] = useState(500000);
  const [riskBudget, setRiskBudget] = useState(1);
  const [liveQuote, setLiveQuote] = useState<LiveQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteRefresh, setQuoteRefresh] = useState(0);

  useEffect(() => {
    fetch("/data/dashboard.json")
      .then((response) => {
        if (!response.ok) throw new Error("Dashboard data is unavailable.");
        return response.json();
      })
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const selected = useMemo(
    () => data?.stocks.find((stock) => stock.symbol === selectedSymbol) ?? data?.stocks[0],
    [data, selectedSymbol],
  );

  const filteredStocks = useMemo(() => {
    if (!data) return [];
    return [...data.stocks]
      .filter((stock) => {
        const term = search.trim().toLowerCase();
        const matchesText =
          !term ||
          stock.symbol.toLowerCase().includes(term) ||
          stock.name.toLowerCase().includes(term) ||
          stock.sector.toLowerCase().includes(term);
        return matchesText && (riskFilter === "All" || stock.riskLevel === riskFilter);
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.symbol.localeCompare(b.symbol);
        if (sortBy === "dayChangePct") return (b.dayChangePct ?? 0) - (a.dayChangePct ?? 0);
        if (sortBy === "signalScore") return b.signalScore - a.signalScore;
        return b.riskScore - a.riskScore;
      });
  }, [data, riskFilter, search, sortBy]);

  useEffect(() => {
    if (!selectedSymbol) return;
    setQuoteLoading(true);
    fetch(`/api/live?symbol=${encodeURIComponent(selectedSymbol)}`)
      .then((response) => response.json())
      .then((payload) => setLiveQuote(payload.status === "ok" ? payload : null))
      .catch(() => setLiveQuote(null))
      .finally(() => setQuoteLoading(false));
  }, [selectedSymbol, quoteRefresh]);

  function chooseStock(stock: Stock) {
    setSelectedSymbol(stock.symbol);
    setActiveView("overview");
    requestAnimationFrame(() => document.querySelector("#stock-detail")?.scrollIntoView({ behavior: "smooth" }));
  }

  function askQuestion(event?: FormEvent) {
    event?.preventDefault();
    if (!data || !query.trim()) return;
    const result = answerQuery(query, data, selected);
    setAnswer(result);
    if (result.stock) setSelectedSymbol(result.stock.symbol);
  }

  if (!data) {
    return (
      <main className="loading-shell">
        <div className="brand-mark"><Activity size={22} /> MM</div>
        <div className="loading-line" />
        <p>Preparing the latest risk view...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActiveView("overview")} aria-label="Market Mind overview">
          <span className="brand-mark"><Activity size={19} /></span>
          <span>Market Mind</span>
        </button>
        <nav aria-label="Dashboard sections">
          <button className={activeView === "overview" ? "active" : ""} onClick={() => setActiveView("overview")}>
            <BarChart3 size={16} /> Overview
          </button>
          <button className={activeView === "sectors" ? "active" : ""} onClick={() => setActiveView("sectors")}>
            <Layers3 size={16} /> Sectors
          </button>
          <button className={activeView === "method" ? "active" : ""} onClick={() => setActiveView("method")}>
            <BookOpen size={16} /> Method
          </button>
        </nav>
        <div className="freshness">
          <span className="live-dot" />
          Market close {formatDate(data.meta.latestMarketDate)}
        </div>
      </header>

      {activeView === "overview" && (
        <>
          <section className="ask-band" aria-labelledby="ask-title">
            <div className="ask-heading">
              <span className="section-icon"><Sparkles size={18} /></span>
              <div>
                <p className="eyebrow">Ask the signals</p>
                <h1 id="ask-title">Understand a stock before you take the risk.</h1>
              </div>
            </div>
            <form className="query-form" onSubmit={askQuestion}>
              <Search size={20} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask: Why is Reliance risky? Compare Infosys with Wipro..."
                aria-label="Ask a stock risk question"
              />
              <button type="submit">Explain <ArrowRight size={17} /></button>
            </form>
            <div className="example-row" aria-label="Example questions">
              {examples.map((example) => (
                <button key={example} onClick={() => { setQuery(example); setAnswer(answerQuery(example, data, selected)); }}>
                  {example}
                </button>
              ))}
            </div>
          </section>

          {answer && <AnswerPanel answer={answer} onClose={() => setAnswer(null)} />}

          <section className="market-strip" aria-label="NIFTY 50 market summary">
            <div className="market-lead">
              <span>NIFTY 50</span>
              <strong>{formatNumber(data.market.latestClose)}</strong>
              <Change value={data.market.dayChangePct} />
            </div>
            <Metric label="One month" value={formatPct(data.market.monthChangePct)} tone={tone(data.market.monthChangePct)} />
            <Metric label="One year" value={formatPct(data.market.yearChangePct)} tone={tone(data.market.yearChangePct)} />
            <Metric label="Advance / decline" value={`${data.market.advancers} / ${data.market.decliners}`} />
            <Metric label="Higher-risk stocks" value={`${data.market.higherRisk} of ${data.meta.stockCount}`} tone="danger" />
            <div className="data-health">
              <ShieldCheck size={19} />
              <span>Data checks</span>
              <strong>{data.meta.qualityIssues === 0 ? "Passed" : `${data.meta.qualityIssues} flags`}</strong>
            </div>
          </section>

          <section className="workspace">
            <div className="universe-panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">NIFTY 50 universe</p>
                  <h2>Risk monitor</h2>
                </div>
                <span>{filteredStocks.length} stocks</span>
              </div>
              <div className="filters">
                <label className="search-control">
                  <Search size={16} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Stock or sector" />
                </label>
                <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} aria-label="Filter by risk">
                  <option>All</option>
                  <option>Lower</option>
                  <option>Moderate</option>
                  <option>Higher</option>
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort stocks">
                  <option value="riskScore">Highest risk</option>
                  <option value="signalScore">Strongest signals</option>
                  <option value="dayChangePct">Daily move</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div className="stock-table" role="table" aria-label="Stock risk table">
                <div className="stock-row stock-header" role="row">
                  <span>Stock</span><span>Price</span><span>Risk</span><span>Signal</span><span />
                </div>
                {filteredStocks.map((stock) => (
                  <button
                    className={`stock-row ${stock.symbol === selected?.symbol ? "selected" : ""}`}
                    key={stock.symbol}
                    onClick={() => chooseStock(stock)}
                    role="row"
                  >
                    <span className="stock-name"><strong>{stock.symbol}</strong><small>{stock.sector}</small></span>
                    <span><strong>{formatMoney(stock.latestClose)}</strong><Change value={stock.dayChangePct} compact /></span>
                    <span><Badge label={stock.riskLevel} color={riskColors[stock.riskLevel]} /><small>{stock.riskScore}/100</small></span>
                    <span><Badge label={stock.signal} color={signalColors[stock.signal]} /><small>{stock.signalScore}/100</small></span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
            </div>

            {selected && (
              <aside className="quick-read">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Selected</p>
                    <h2>{selected.symbol}</h2>
                  </div>
                  <Badge label={`${selected.riskLevel} risk`} color={riskColors[selected.riskLevel]} />
                </div>
                <p>{selected.name}</p>
                <div className="quick-price">
                  <div>
                    <small>{liveQuote?.symbol === selected.symbol ? "Latest available quote" : "Stored close"}</small>
                    <strong>{formatMoney(liveQuote?.symbol === selected.symbol ? liveQuote.price : selected.latestClose)}</strong>
                  </div>
                  <Change value={liveQuote?.symbol === selected.symbol ? liveQuote.changePct : selected.dayChangePct} />
                </div>
                <button className="quote-refresh" onClick={() => setQuoteRefresh((value) => value + 1)} disabled={quoteLoading}>
                  <RefreshCw size={14} className={quoteLoading ? "spinning" : ""} />
                  {quoteLoading ? "Checking market..." : liveQuote ? `Quote from ${formatDateTime(liveQuote.marketTime)}` : "Check latest quote"}
                </button>
                <SignalChecks stock={selected} />
                <button className="primary-wide" onClick={() => document.querySelector("#stock-detail")?.scrollIntoView({ behavior: "smooth" })}>
                  Open full analysis <ArrowDownRight size={17} />
                </button>
              </aside>
            )}
          </section>

          {selected && (
            <section id="stock-detail" className="detail-section">
              <div className="detail-title">
                <div>
                  <p className="eyebrow">{selected.sector}</p>
                  <h2>{selected.name}</h2>
                  <p>{selected.dataPoints} daily observations through {formatDate(selected.latestDate)}</p>
                </div>
                <div className="detail-price">
                  <strong>{formatMoney(liveQuote?.symbol === selected.symbol ? liveQuote.price : selected.latestClose)}</strong>
                  <Change value={liveQuote?.symbol === selected.symbol ? liveQuote.changePct : selected.dayChangePct} />
                </div>
              </div>

              <div className="chart-layout">
                <div className="chart-panel">
                  <div className="chart-toolbar">
                    <div className="segmented">
                      <button className={chartMode === "daily" ? "active" : ""} onClick={() => setChartMode("daily")}>Daily</button>
                      <button className={chartMode === "30m" ? "active" : ""} onClick={() => setChartMode("30m")}>30 min</button>
                    </div>
                    {chartMode === "daily" && (
                      <div className="segmented compact">
                        {["1M", "3M", "1Y", "3Y"].map((window) => (
                          <button className={chartWindow === window ? "active" : ""} key={window} onClick={() => setChartWindow(window)}>
                            {window}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <CandlestickChart
                    candles={chartMode === "30m" ? selected.intraday : windowCandles(selected.candles, chartWindow)}
                    label={chartMode === "30m" ? "30-minute candles" : `${chartWindow} daily candles`}
                  />
                  <div className="chart-foot">
                    <span><i className="up-key" /> Close above open</span>
                    <span><i className="down-key" /> Close below open</span>
                    <span><CalendarDays size={15} /> Adjusted prices drive risk; raw close is displayed</span>
                  </div>
                </div>

                <div className="risk-panel">
                  <div className="score-head">
                    <div>
                      <span>Overall risk</span>
                      <strong>{selected.riskScore}<small>/100</small></strong>
                    </div>
                    <RiskGauge score={selected.riskScore} color={riskColors[selected.riskLevel]} />
                  </div>
                  <p className="plain-summary">{riskSummary(selected)}</p>
                  <div className="risk-metrics">
                    <RiskMetric label="Volatility" value={formatPct(selected.volatility)} note="Typical annual price variability" />
                    <RiskMetric label="Worst 1Y fall" value={formatPct(selected.maxDrawdown1y)} note="Largest peak-to-low decline" />
                    <RiskMetric label="Market sensitivity" value={formatDecimal(selected.beta)} note={betaText(selected.beta)} />
                    <RiskMetric label="Bad-day estimate" value={formatPct(-Math.abs(selected.valueAtRisk95 ?? 0))} note="95% historical daily threshold" />
                    <RiskMetric label="Market correlation" value={formatDecimal(selected.correlation)} note="How closely it moves with NIFTY" />
                    <RiskMetric label="Trading range" value={formatPct(selected.atrPct)} note="Average daily range as % of price" />
                  </div>
                </div>
              </div>

              <div className="decision-grid">
                <section className="signal-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Decision signals</p>
                      <h3>{selected.signal}</h3>
                    </div>
                    <span className="signal-score" style={{ color: signalColors[selected.signal] }}>{selected.signalScore}/100</span>
                  </div>
                  <SignalChecks stock={selected} detailed />
                  <div className="return-strip">
                    <Metric label="1 week" value={formatPct(selected.weekChangePct)} tone={tone(selected.weekChangePct)} />
                    <Metric label="1 month" value={formatPct(selected.monthChangePct)} tone={tone(selected.monthChangePct)} />
                    <Metric label="3 months" value={formatPct(selected.quarterChangePct)} tone={tone(selected.quarterChangePct)} />
                    <Metric label="1 year" value={formatPct(selected.yearChangePct)} tone={tone(selected.yearChangePct)} />
                  </div>
                </section>

                <PositionSizer
                  stock={selected}
                  portfolio={portfolio}
                  riskBudget={riskBudget}
                  onPortfolioChange={setPortfolio}
                  onRiskChange={setRiskBudget}
                />
              </div>

              <section className="actions-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Price context</p>
                    <h3>Corporate actions</h3>
                  </div>
                  <Info size={18} />
                </div>
                {selected.corporateActions.length ? (
                  <div className="action-list">
                    {selected.corporateActions.map((action, index) => (
                      <div key={`${action.date}-${action.type}-${index}`}>
                        <span className="action-icon"><CircleDollarSign size={17} /></span>
                        <strong>{sentenceCase(action.type)}</strong>
                        <span>{formatDate(action.date)}</span>
                        <span>{action.dividend ? `₹${action.dividend} per share` : action.splitRatio || "Recorded adjustment"}</span>
                      </div>
                    ))}
                  </div>
                ) : <p>No recent dividend or split record is stored for this stock.</p>}
              </section>
            </section>
          )}
        </>
      )}

      {activeView === "sectors" && <SectorView data={data} onSelectStock={chooseStock} />}
      {activeView === "method" && <MethodView data={data} />}

      <footer>
        <span><Activity size={16} /> Market Mind</span>
        <p>{data.meta.disclaimer} Signals describe historical data and do not predict future returns.</p>
        <span>Daily OHLCV + recent 30-minute candles</span>
      </footer>
    </main>
  );
}

function AnswerPanel({ answer, onClose }: { answer: Answer; onClose: () => void }) {
  return (
    <section className="answer-panel" aria-live="polite">
      <div className="answer-top">
        <span className="section-icon"><Sparkles size={18} /></span>
        <div><p className="eyebrow">Signal explanation</p><h2>{answer.title}</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="Close explanation">×</button>
      </div>
      <p className="answer-summary">{answer.summary}</p>
      <div className="answer-columns">
        <div><span className="answer-label">What</span><p>{answer.what}</p></div>
        <div><span className="answer-label">Why</span><ul>{answer.why.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><span className="answer-label">How to use it</span><ol>{answer.how.map((item) => <li key={item}>{item}</li>)}</ol></div>
      </div>
    </section>
  );
}

function CandlestickChart({ candles, label }: { candles: Candle[]; label: string }) {
  const width = 920;
  const height = 360;
  const padding = { top: 22, right: 56, bottom: 34, left: 18 };
  if (!candles.length) return <div className="empty-chart">No candles are available for this view.</div>;
  const sampled = candles.length > 280 ? candles.filter((_, index) => index % Math.ceil(candles.length / 280) === 0) : candles;
  const lows = sampled.map((candle) => candle[3]);
  const highs = sampled.map((candle) => candle[2]);
  const low = Math.min(...lows);
  const high = Math.max(...highs);
  const range = Math.max(high - low, 1);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xStep = chartWidth / sampled.length;
  const candleWidth = Math.max(1.2, Math.min(7, xStep * 0.64));
  const y = (value: number) => padding.top + ((high - value) / range) * chartHeight;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => high - range * part);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label} candlestick chart`}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} className="grid-line" />
            <text x={width - padding.right + 8} y={y(tick) + 4} className="axis-label">{formatNumber(tick)}</text>
          </g>
        ))}
        {sampled.map((candle, index) => {
          const [, open, candleHigh, candleLow, close] = candle;
          const x = padding.left + index * xStep + xStep / 2;
          const rising = close >= open;
          const bodyTop = y(Math.max(open, close));
          const bodyHeight = Math.max(1.5, Math.abs(y(open) - y(close)));
          return (
            <g key={`${candle[0]}-${index}`} className={rising ? "candle-up" : "candle-down"}>
              <line x1={x} x2={x} y1={y(candleHigh)} y2={y(candleLow)} />
              <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} rx="0.5" />
              <title>{`${formatDateTime(candle[0])}: O ${open}, H ${candleHigh}, L ${candleLow}, C ${close}`}</title>
            </g>
          );
        })}
        <text x={padding.left} y={height - 9} className="axis-label">{formatDate(sampled[0][0])}</text>
        <text x={width - padding.right} y={height - 9} textAnchor="end" className="axis-label">{formatDate(sampled.at(-1)?.[0] ?? "")}</text>
      </svg>
    </div>
  );
}

function PositionSizer({
  stock,
  portfolio,
  riskBudget,
  onPortfolioChange,
  onRiskChange,
}: {
  stock: Stock;
  portfolio: number;
  riskBudget: number;
  onPortfolioChange: (value: number) => void;
  onRiskChange: (value: number) => void;
}) {
  const stopDistance = Math.max((stock.atr14 ?? stock.latestClose * 0.02) * 2, 0.01);
  const riskAmount = portfolio * (riskBudget / 100);
  const sharesByRisk = Math.floor(riskAmount / stopDistance);
  const sharesByCapital = Math.floor((portfolio * 0.2) / stock.latestClose);
  const shares = Math.max(0, Math.min(sharesByRisk, sharesByCapital));
  const positionValue = shares * stock.latestClose;
  const stopPrice = Math.max(0, stock.latestClose - stopDistance);

  return (
    <section className="sizer-panel">
      <div className="section-head">
        <div><p className="eyebrow">Risk planner</p><h3>Position size</h3></div>
        <SlidersHorizontal size={19} />
      </div>
      <div className="input-grid">
        <label>Portfolio value <span>₹</span><input type="number" min="10000" step="10000" value={portfolio} onChange={(event) => onPortfolioChange(Number(event.target.value))} /></label>
        <label>Risk per idea <span>%</span><input type="number" min="0.1" max="5" step="0.1" value={riskBudget} onChange={(event) => onRiskChange(Number(event.target.value))} /></label>
      </div>
      <div className="sizer-result">
        <div><span>Illustrative quantity</span><strong>{formatNumber(shares)} shares</strong></div>
        <div><span>Position value</span><strong>{formatMoney(positionValue)}</strong></div>
        <div><span>2× range stop</span><strong>{formatMoney(stopPrice)}</strong></div>
        <div><span>Capital used</span><strong>{formatPct(positionValue / portfolio * 100)}</strong></div>
      </div>
      <p><Info size={15} /> Limited to 20% of the portfolio and the chosen loss budget. This is a planning illustration, not a recommendation.</p>
    </section>
  );
}

function SectorView({ data, onSelectStock }: { data: DashboardData; onSelectStock: (stock: Stock) => void }) {
  return (
    <section className="page-view">
      <div className="page-view-head">
        <div><p className="eyebrow">Concentration view</p><h1>Sector risk map</h1></div>
        <p>See whether risk is isolated to one stock or shared across an industry group.</p>
      </div>
      <div className="sector-grid">
        {data.sectors.map((sector) => (
          <article key={sector.sector}>
            <div className="section-head">
              <div><h2>{sector.sector}</h2><p>{sector.stocks} NIFTY 50 stocks</p></div>
              <Badge label={`${sector.averageRisk}/100 risk`} color={riskColors[sector.averageRisk >= 67 ? "Higher" : sector.averageRisk >= 34 ? "Moderate" : "Lower"]} />
            </div>
            <div className="sector-bar"><span style={{ width: `${sector.averageRisk}%` }} /></div>
            <div className="sector-stats">
              <Metric label="Average volatility" value={formatPct(sector.averageVolatility)} />
              <Metric label="One-month move" value={formatPct(sector.monthChangePct)} tone={tone(sector.monthChangePct)} />
            </div>
            <div className="sector-members">
              {data.stocks.filter((stock) => stock.sector === sector.sector).map((stock) => (
                <button key={stock.symbol} onClick={() => onSelectStock(stock)}>
                  <span>{stock.symbol}</span><Badge label={stock.riskLevel} color={riskColors[stock.riskLevel]} /><ChevronRight size={15} />
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MethodView({ data }: { data: DashboardData }) {
  const methods = [
    ["Volatility", "How widely daily adjusted returns moved, annualised from the most recent 60 trading days."],
    ["Drawdown", "The largest fall from a previous high. This describes the depth of historical pain, not its duration."],
    ["Beta", "How much the stock tended to move when NIFTY 50 moved by 1%. A beta above 1 means greater market sensitivity."],
    ["Correlation", "How consistently the stock and NIFTY 50 moved in the same direction, from -1 to +1."],
    ["95% bad-day estimate", "The historical daily loss threshold exceeded on roughly 5% of observed trading days."],
    ["Liquidity", "Average rupee value traded over 20 days. Lower liquidity contributes more to the risk score."],
    ["Signal score", "A transparent blend of trend, momentum, market-relative strength, and a risk buffer. It is not a buy or sell call."],
    ["Position size", "A quantity limited by the chosen loss budget, two average trading ranges, and a 20% portfolio cap."],
  ];
  return (
    <section className="page-view method-view">
      <div className="page-view-head">
        <div><p className="eyebrow">No black box</p><h1>How the dashboard thinks</h1></div>
        <p>Every explanation is assembled from measured signals. No news, fundamentals, forecasts, or generative model is used.</p>
      </div>
      <div className="method-stats">
        <Metric label="Daily observations" value={formatNumber(data.meta.dailyRows)} />
        <Metric label="Recent intraday observations" value={formatNumber(data.meta.intradayRows)} />
        <Metric label="Coverage" value={`${formatDate(data.meta.dailyRange[0])} – ${formatDate(data.meta.dailyRange[1])}`} />
        <Metric label="Universe" value={`${data.meta.stockCount} NIFTY 50 stocks`} />
      </div>
      <div className="method-list">
        {methods.map(([name, description], index) => (
          <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><h2>{name}</h2><p>{description}</p></article>
        ))}
      </div>
      <div className="method-note">
        <AlertTriangle size={20} />
        <p><strong>Read signals as evidence, not certainty.</strong> Historical market behaviour can change. Corporate events, regulation, earnings, and macro news can make past relationships unreliable.</p>
      </div>
    </section>
  );
}

function SignalChecks({ stock, detailed = false }: { stock: Stock; detailed?: boolean }) {
  const checks = [
    ["Price above 50-day average", stock.signals.priceAbove50d, "Near-term trend"],
    ["50-day above 200-day average", stock.signals.fiftyAbove200d, "Longer trend"],
    ["Positive one-month return", stock.signals.positiveMonth, "Recent momentum"],
    ["Positive three-month return", stock.signals.positiveQuarter, "Quarter momentum"],
    ["Beat NIFTY over three months", stock.signals.beatsMarketQuarter, "Relative strength"],
  ];
  return (
    <div className={`signal-checks ${detailed ? "detailed" : ""}`}>
      {checks.map(([label, passed, note]) => (
        <div key={String(label)}>
          {passed ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
          <span><strong>{label}</strong>{detailed && <small>{note}</small>}</span>
          <b className={passed ? "pass" : "miss"}>{passed ? "Yes" : "No"}</b>
        </div>
      ))}
    </div>
  );
}

function RiskGauge({ score, color }: { score: number; color: string }) {
  return <div className="risk-gauge" style={{ "--score": `${score}%`, "--gauge-color": color } as React.CSSProperties}><span /></div>;
}

function RiskMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function Metric({ label, value, tone: metricTone = "" }: { label: string; value: string; tone?: string }) {
  return <div className={`metric ${metricTone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span className="badge" style={{ "--badge-color": color } as React.CSSProperties}><i />{label}</span>;
}

function Change({ value, compact = false }: { value: number | null; compact?: boolean }) {
  const number = value ?? 0;
  const Icon = number >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={`change ${number >= 0 ? "positive" : "negative"} ${compact ? "compact-change" : ""}`}><Icon size={compact ? 13 : 16} />{formatPct(number)}</span>;
}

function answerQuery(query: string, data: DashboardData, fallback?: Stock): Answer {
  const normalized = query.toLowerCase();
  const matches = data.stocks.filter((stock) => {
    const simpleName = stock.name.toLowerCase().replace(/\b(limited|ltd\.?|bank)\b/g, "").trim();
    return normalized.includes(stock.symbol.toLowerCase()) ||
      normalized.includes(simpleName.split(" ")[0]) ||
      (stock.symbol === "HDFCBANK" && normalized.includes("hdfc bank"));
  });
  const stock = matches[0] ?? fallback ?? data.stocks[0];

  if ((normalized.includes("compare") || normalized.includes(" versus ") || normalized.includes(" vs ")) && matches.length >= 2) {
    const other = matches[1];
    const safer = stock.riskScore <= other.riskScore ? stock : other;
    const stronger = stock.signalScore >= other.signalScore ? stock : other;
    return {
      title: `${stock.symbol} compared with ${other.symbol}`,
      summary: `${safer.symbol} currently carries the lower measured risk score, while ${stronger.symbol} has the stronger trend-and-momentum signal.`,
      what: `${stock.symbol} is ${stock.riskLevel.toLowerCase()} risk (${stock.riskScore}/100) with a ${stock.signal.toLowerCase()} signal. ${other.symbol} is ${other.riskLevel.toLowerCase()} risk (${other.riskScore}/100) with a ${other.signal.toLowerCase()} signal.`,
      why: [
        `${stock.symbol}: ${formatPct(stock.volatility)} volatility, ${formatPct(stock.maxDrawdown1y)} worst one-year fall, beta ${formatDecimal(stock.beta)}.`,
        `${other.symbol}: ${formatPct(other.volatility)} volatility, ${formatPct(other.maxDrawdown1y)} worst one-year fall, beta ${formatDecimal(other.beta)}.`,
        `${stronger.symbol} passes more of the current trend, momentum, and market-relative checks.`,
      ],
      how: [
        "Use the lower risk score to judge historical stability, not expected return.",
        "Open each chart and check whether the trend remains consistent across one month, three months, and one year.",
        "Size either position from a loss budget; do not give the stronger signal a larger position automatically.",
      ],
      stock,
    };
  }

  const lossThreshold = formatPct(-Math.abs(stock.valueAtRisk95 ?? 0));
  const sizingIntent = /size|quantity|shares|how much|position/.test(normalized);
  const whyIntent = /why|reason|risky|risk/.test(normalized);
  const signalIntent = /signal|trend|momentum|say|outlook/.test(normalized);
  const title = sizingIntent
    ? `A risk-based way to size ${stock.symbol}`
    : whyIntent
      ? `Why ${stock.symbol} is ${stock.riskLevel.toLowerCase()} risk`
      : `What the current ${stock.symbol} signals show`;

  return {
    title,
    summary: `${stock.symbol} has a ${stock.riskLevel.toLowerCase()} risk score of ${stock.riskScore}/100 and a ${stock.signal.toLowerCase()} evidence score of ${stock.signalScore}/100. ${riskSummary(stock)}`,
    what: sizingIntent
      ? `Start with the amount you can afford to lose, not the amount you hope to earn. The planner uses two average daily ranges (${formatMoney((stock.atr14 ?? 0) * 2)}) as an illustrative stop distance.`
      : signalIntent
        ? `${stock.signal} means the measured trend, momentum, relative performance, and risk buffer currently produce a score of ${stock.signalScore}/100. It is not a price forecast.`
        : `On 95% of historical days, the loss was better than roughly ${lossThreshold}. The worst peak-to-low fall over the last year was ${formatPct(stock.maxDrawdown1y)}.`,
    why: [
      `Annualised volatility is ${formatPct(stock.volatility)}, describing how widely returns have moved.`,
      `Beta is ${formatDecimal(stock.beta)}: ${betaText(stock.beta)}`,
      `The stock is ${stock.signals.priceAbove50d ? "above" : "below"} its 50-day average and the one-month return is ${formatPct(stock.monthChangePct)}.`,
      `${stock.signals.beatsMarketQuarter ? "It beat" : "It lagged"} NIFTY 50 over the last three months.`,
    ],
    how: [
      "Use the risk score to decide whether the stock fits your comfort with price swings and drawdowns.",
      "Use the chart to check whether the signal comes from a steady trend or a short, sharp move.",
      "Choose a maximum loss per idea, estimate a stop distance, then let the position-size planner calculate a quantity.",
      "Recheck after a large move, corporate action, or daily data refresh because the evidence can change.",
    ],
    stock,
  };
}

function riskSummary(stock: Stock) {
  if (stock.riskLevel === "Higher") return "Its historical swings, drawdowns, market sensitivity, tail losses, or trading liquidity are high relative to the NIFTY 50 group.";
  if (stock.riskLevel === "Lower") return "Its measured risk factors are lower than most stocks in this NIFTY 50 comparison, though losses are still possible.";
  return "Its measured risk sits near the middle of the NIFTY 50 group, so the individual risk drivers matter more than the label alone.";
}

function betaText(beta: number | null) {
  if (beta === null) return "Not enough matching history.";
  if (beta > 1.2) return "It has tended to amplify market moves.";
  if (beta < 0.8) return "It has tended to move less than the market.";
  return "It has tended to move broadly in line with the market.";
}

function windowCandles(candles: Candle[], window: string) {
  const sizes: Record<string, number> = { "1M": 22, "3M": 66, "1Y": 252, "3Y": 756 };
  return candles.slice(-sizes[window]);
}

function tone(value: number | null) {
  return (value ?? 0) >= 0 ? "good" : "danger";
}

function formatMoney(value: number | null) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value ?? 0);
}

function formatNumber(value: number | null) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value ?? 0);
}

function formatPct(value: number | null) {
  const number = value ?? 0;
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function formatDecimal(value: number | null) {
  return value === null ? "—" : value.toFixed(2);
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function formatDateTime(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: value.includes("T") ? "short" : undefined }).format(new Date(value));
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

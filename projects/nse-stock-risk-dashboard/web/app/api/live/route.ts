import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const symbol = (request.nextUrl.searchParams.get("symbol") || "RELIANCE")
    .toUpperCase()
    .replace(/[^A-Z0-9&-]/g, "");
  const ticker = symbol === "NIFTY50" ? "^NSEI" : `${symbol}.NS`;
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;

  try {
    const response = await fetch(endpoint, {
      headers: { "User-Agent": "Mozilla/5.0 Market-Mind-Dashboard" },
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`Market source returned ${response.status}`);
    const payload = await response.json();
    const result = payload?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const closes: Array<number | null> = result?.indicators?.quote?.[0]?.close ?? [];
    const valid = closes
      .map((close, index) => ({ close, timestamp: timestamps[index] }))
      .filter((item) => typeof item.close === "number");
    const latest = valid.at(-1);
    const previous = valid.at(-2);
    if (!latest) throw new Error("No current quote was returned");
    const changePct = previous?.close
      ? ((Number(latest.close) / Number(previous.close)) - 1) * 100
      : null;
    return NextResponse.json({
      status: "ok",
      symbol,
      price: latest.close,
      previousClose: previous?.close ?? null,
      changePct,
      marketTime: new Date(latest.timestamp * 1000).toISOString(),
      delayed: true,
      source: "Yahoo Finance",
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Live quote unavailable" },
      { status: 502 },
    );
  }
}

// chitti-shares/frontend/src/pages/StockChart.jsx
//
// Candlestick chart for a stock + Roshan indicator pane (RSI + SMA-of-RSI)
// + auto support/resistance horizontal lines + auto trendlines
// + timeframe tabs + toggles + Chitti's View placeholder.
//
// Uses lightweight-charts (Apache 2.0, ~5KB).

import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { createChart, CrosshairMode, LineStyle } from "lightweight-charts";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://chitti-shares-api.onrender.com";

const TIMEFRAMES = ["Monthly", "Weekly", "Daily", "4H", "1H", "15min", "5min", "1min"];

// Per-spec timeframe colors for S/R + trendlines
const TF_COLORS = {
  Monthly:  "#9333ea", // purple
  Weekly:   "#ffffff", // white
  Daily:    "#dc2626", // red
  "4H":     "#b45309", // dark yellow / amber-700
  "1H":     "#16a34a", // green
  "15min":  "#fb923c", // orange
  "5min":   "#38bdf8", // sky blue
  "1min":   "#ec4899", // pink
};

export default function StockChart() {
  const { symbol: rawSymbol } = useParams();
  const symbol = rawSymbol ? decodeURIComponent(rawSymbol) : "NSE:NIFTY 50";

  const [tf, setTf] = useState("Daily");
  const [showSR, setShowSR] = useState(true);
  const [showTrend, setShowTrend] = useState(true);
  const [tfEnabled, setTfEnabled] = useState({
    Monthly: true, Weekly: true, Daily: true, "4H": true, "1H": true,
    "15min": false, "5min": false, "1min": false,
  });

  const [candles, setCandles] = useState([]);
  const [levelsByTf, setLevelsByTf] = useState({});  // { Daily: {...}, Weekly: {...}, ... }
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Chitti's View — wired to /api/chitti-view (DeepSeek)
  const [chittiView, setChittiView] = useState(null);     // { verdict, summary, language } | null
  const [chittiLoading, setChittiLoading] = useState(false);

  // Chart refs
  const chartContainerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const rsiChartRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const rsiSmaSeriesRef = useRef(null);
  const priceLinesRef = useRef([]); // for cleanup
  const trendSeriesRef = useRef([]); // overlay line series for trendlines

  // ---------- data fetching ----------
  async function fetchCandles(tfArg) {
    setLoading(true);
    setErr("");
    try {
      const url = `${API_BASE}/api/candles/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(tfArg)}&days_back=180`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Candles HTTP ${r.status}`);
      const data = await r.json();
      setCandles(data || []);
    } catch (e) {
      setErr(e.message || "Failed to load candles");
    } finally {
      setLoading(false);
    }
  }

  // Fetch DeepSeek-powered Chitti's View whenever a fresh candle set lands.
  // Auto-speaks the summary on arrival (user may be blind / illiterate / elderly).
  async function fetchChittiView(tfArg) {
    if (!candles.length) return;
    setChittiLoading(true);
    try {
      const closes = candles.map(c => c.close);
      const rsiArr = computeRSI(closes, 14);
      const ma50Arr = computeSMA(closes, 50);
      const ma200Arr = computeSMA(closes, 200);
      const last = candles[candles.length - 1];
      const lastRsi = rsiArr[rsiArr.length - 1];
      const lastMa50 = ma50Arr[ma50Arr.length - 1];
      const lastMa200 = ma200Arr[ma200Arr.length - 1];
      let trend = "sideways";
      if (last && lastMa50 != null) {
        if (last.close > lastMa50 && (lastMa200 == null || lastMa50 > lastMa200)) trend = "uptrend";
        else if (last.close < lastMa50 && (lastMa200 == null || lastMa50 < lastMa200)) trend = "downtrend";
      }
      const r = await fetch(`${API_BASE}/api/chitti-view/${encodeURIComponent(symbol)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe: tfArg,
          rsi: lastRsi != null && !Number.isNaN(lastRsi) ? lastRsi : null,
          macd_signal: null,
          trend,
          price: last ? last.close : null,
          ma50: lastMa50 != null && !Number.isNaN(lastMa50) ? lastMa50 : null,
          ma200: lastMa200 != null && !Number.isNaN(lastMa200) ? lastMa200 : null,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setChittiView(data);
      // Auto-speak the verdict + summary — user may be blind
      if (data?.summary && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(data.summary);
        u.lang = 'en-IN';
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      console.warn('chitti-view fetch failed', e);
      setChittiView(null);
    } finally {
      setChittiLoading(false);
    }
  }

  async function fetchLevels(tfArg) {
    try {
      const url = `${API_BASE}/api/levels/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(tfArg)}`;
      const r = await fetch(url);
      if (!r.ok) return;
      const data = await r.json();
      setLevelsByTf(prev => ({ ...prev, [tfArg]: data }));
    } catch (e) {
      // non-fatal — chart still renders without lines
      console.warn("levels fetch failed", e);
    }
  }

  // Fetch candles on tf/symbol change. Fetch levels for ALL enabled timeframes.
  useEffect(() => {
    fetchCandles(tf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tf, symbol]);

  // Reset level cache and refetch all enabled TFs whenever symbol changes.
  useEffect(() => {
    setLevelsByTf({});
  }, [symbol]);

  useEffect(() => {
    TIMEFRAMES.forEach(t => {
      if (tfEnabled[t] && !levelsByTf[t]) fetchLevels(t);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tfEnabled, symbol, levelsByTf]);

  // ---------- chart init ----------
  useEffect(() => {
    if (!chartContainerRef.current || !rsiContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 420,
      layout: { background: { color: "#ffffff" }, textColor: "#222" },
      grid: { vertLines: { color: "#eee" }, horzLines: { color: "#eee" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#ccc" },
      timeScale: { borderColor: "#ccc", timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#0f5132", downColor: "#842029",
      borderUpColor: "#0f5132", borderDownColor: "#842029",
      wickUpColor: "#0f5132", wickDownColor: "#842029",
    });

    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: 180,
      layout: { background: { color: "#fafafa" }, textColor: "#444" },
      grid: { vertLines: { color: "#eee" }, horzLines: { color: "#eee" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#ccc" },
      timeScale: { borderColor: "#ccc", timeVisible: true, secondsVisible: false },
    });
    rsiChartRef.current = rsiChart;
    rsiSeriesRef.current    = rsiChart.addLineSeries({ color: "#1e40af", lineWidth: 2 });
    rsiSmaSeriesRef.current = rsiChart.addLineSeries({ color: "#b45309", lineWidth: 2 });

    // 30/70 horizontal references
    rsiSeriesRef.current.createPriceLine({
      price: 70, color: "#888", lineWidth: 1, lineStyle: LineStyle.Dashed,
      axisLabelVisible: true, title: "70",
    });
    rsiSeriesRef.current.createPriceLine({
      price: 30, color: "#888", lineWidth: 1, lineStyle: LineStyle.Dashed,
      axisLabelVisible: true, title: "30",
    });

    // sync time scale between price + rsi panes
    chart.timeScale().subscribeVisibleLogicalRangeChange((r) => {
      if (r) rsiChart.timeScale().setVisibleLogicalRange(r);
    });
    rsiChart.timeScale().subscribeVisibleLogicalRangeChange((r) => {
      if (r) chart.timeScale().setVisibleLogicalRange(r);
    });

    // resize
    const onResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      if (rsiContainerRef.current)   rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      rsiChart.remove();
    };
  }, []);

  // ---------- push candle data into chart ----------
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (!candles.length) return;

    candleSeriesRef.current.setData(candles);

    // Compute RSI(14) and SMA(20) of RSI on the client for the indicator pane.
    // (Backend technical_report has it but we don't need a separate call here.)
    const closes = candles.map(c => c.close);
    const rsi = computeRSI(closes, 14);
    const rsiSma = computeSMA(rsi, 20);

    const rsiData = candles.map((c, i) => ({ time: c.time, value: rsi[i] }))
                           .filter(p => p.value != null && !Number.isNaN(p.value));
    const smaData = candles.map((c, i) => ({ time: c.time, value: rsiSma[i] }))
                           .filter(p => p.value != null && !Number.isNaN(p.value));

    if (rsiSeriesRef.current) rsiSeriesRef.current.setData(rsiData);
    if (rsiSmaSeriesRef.current) rsiSmaSeriesRef.current.setData(smaData);

    chartRef.current?.timeScale().fitContent();
    rsiChartRef.current?.timeScale().fitContent();

    // Trigger Chitti's View on every fresh candle set (covers tf + symbol changes)
    fetchChittiView(tf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles]);

  // ---------- draw S/R + trendlines as price lines / line series ----------
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Clear previous price lines
    priceLinesRef.current.forEach(({ series, line }) => {
      try { series.removePriceLine(line); } catch (_) {}
    });
    priceLinesRef.current = [];

    // Clear previous trendline overlay series
    if (chartRef.current && trendSeriesRef.current.length) {
      trendSeriesRef.current.forEach(s => {
        try { chartRef.current.removeSeries(s); } catch (_) {}
      });
      trendSeriesRef.current = [];
    }

    if (!showSR && !showTrend) return;

    TIMEFRAMES.forEach((t) => {
      if (!tfEnabled[t]) return;
      const lv = levelsByTf[t];
      if (!lv) return;

      const color = TF_COLORS[t];

      if (showSR) {
        (lv.support || []).forEach((s) => {
          const line = candleSeriesRef.current.createPriceLine({
            price: s.price, color, lineWidth: 1, lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `${t} S ${s.price}`,
          });
          priceLinesRef.current.push({ series: candleSeriesRef.current, line });
        });
        (lv.resistance || []).forEach((s) => {
          const line = candleSeriesRef.current.createPriceLine({
            price: s.price, color, lineWidth: 1, lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `${t} R ${s.price}`,
          });
          priceLinesRef.current.push({ series: candleSeriesRef.current, line });
        });
      }

      if (showTrend && (lv.trendlines || []).length && candles.length) {
        (lv.trendlines || []).forEach((tl) => {
          // Reconstruct line over the chart's visible range.
          // Backend gives slope/intercept in candle-index space.
          // We'll draw from tl.start_date to tl.end_date.
          // Trust dates from backend, not slope/intercept (those are computed in
          // a different candle-index space and don't translate to this chart).
          // We need to find the two endpoint prices from the cluster:
          // backend already told us the line is fit through pivots — we can recompute
          // start/end prices directly from the candle data at those dates.
          const startTs = dateStrToUnix(tl.start_date);
          const endTs   = dateStrToUnix(tl.end_date);
          const startIdx = candles.findIndex(c => c.time >= startTs);
          let endIdx = candles.findIndex(c => c.time >= endTs);
          if (endIdx === -1) endIdx = candles.length - 1;
          if (startIdx === -1 || endIdx <= startIdx) return;

          // Use the candle's high (for resistance) or low (for support)
          // at the start and end dates as the trendline anchor points.
          // This matches how the user visually expects the line to sit.
          const isResistance = tl.kind === "resistance";
          const yStart = isResistance ? candles[startIdx].high : candles[startIdx].low;
          const yEnd   = isResistance ? candles[endIdx].high   : candles[endIdx].low;

          const series = chartRef.current.addLineSeries({
            color, lineWidth: 2, lineStyle: LineStyle.Solid,
            priceLineVisible: false, lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          // Two-point line strictly bounded to the pivot date range.
          series.setData([
            { time: candles[startIdx].time, value: yStart },
            { time: candles[endIdx].time,   value: yEnd },
          ]);
          trendSeriesRef.current.push(series);
        });
      }
    });
  }, [levelsByTf, showSR, showTrend, tfEnabled, candles]);

  const last = candles.length ? candles[candles.length - 1] : null;
  const prev = candles.length > 1 ? candles[candles.length - 2] : null;
  const pch = last && prev ? ((last.close - prev.close) / prev.close) * 100 : null;
  const pchColor = pch == null ? "#777" : pch >= 0 ? "#0f5132" : "#842029";

  return (
    <div style={{ padding: "16px 20px", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{symbol}</h1>
        {last && (
          <>
            <span style={{ fontSize: 18, fontWeight: 500 }}>
              ₹{Number(last.close).toFixed(2)}
            </span>
            {pch != null && (
              <span style={{ fontSize: 14, color: pchColor }}>
                {pch >= 0 ? "+" : ""}{pch.toFixed(2)}%
              </span>
            )}
          </>
        )}
      </div>
      <div style={{ marginTop: 4, marginBottom: 16 }}>
        <Link to="/scanner" style={{ fontSize: 13, color: "#0f5132" }}>← Back to Scanner</Link>
      </div>

      {/* Timeframe tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {TIMEFRAMES.map((t) => (
          <button key={t} onClick={() => setTf(t)}
            style={{
              padding: "6px 14px", fontSize: 13,
              border: "1px solid " + (t === tf ? "#0f5132" : "#ccc"),
              background: t === tf ? "#0f5132" : "white",
              color: t === tf ? "white" : "#222",
              borderRadius: 4, cursor: "pointer", fontWeight: 500,
            }}
          >{t}</button>
        ))}
      </div>

      {/* Toggles */}
      <div style={{
        display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12,
        fontSize: 13, padding: "8px 12px", background: "#f7f7f8",
        borderRadius: 6, border: "1px solid #e5e7eb",
      }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={showSR} onChange={(e) => setShowSR(e.target.checked)} />
          Show S/R lines
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={showTrend} onChange={(e) => setShowTrend(e.target.checked)} />
          Show trendlines
        </label>
        <span style={{ borderLeft: "1px solid #ccc", paddingLeft: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {TIMEFRAMES.map((t) => (
            <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={!!tfEnabled[t]}
                onChange={(e) => setTfEnabled(prev => ({ ...prev, [t]: e.target.checked }))} />
              <span style={{ display: "inline-block", width: 12, height: 12,
                background: TF_COLORS[t], border: "1px solid #999", borderRadius: 2,
                flexShrink: 0 }} />
              <span style={{ marginLeft: 2 }}>{t}</span>
            </label>
          ))}
        </span>
      </div>

      {err && (
        <div style={{
          padding: 12, marginBottom: 12, background: "#fbeaec",
          border: "1px solid #842029", color: "#842029", borderRadius: 6,
        }}>Error: {err}</div>
      )}

      {/* Chart */}
      <div ref={chartContainerRef} style={{
        width: "100%", height: 420, border: "1px solid #e5e7eb",
        borderRadius: 6, marginBottom: 8, background: "white",
      }} />
      {/* RSI pane */}
      <div ref={rsiContainerRef} style={{
        width: "100%", height: 180, border: "1px solid #e5e7eb",
        borderRadius: 6, marginBottom: 16, background: "#fafafa",
      }} />

      {/* Chitti's View — wired to /api/chitti-view (DeepSeek). Auto-speaks. */}
      <div style={{
        padding: 14, background: "#f0f9ff", border: "1px solid #bae6fd",
        borderRadius: 6, fontSize: 14, color: "#0c4a6e",
      }}>
        <b>Chitti's View</b>
        {chittiLoading ? (
          <div style={{ marginTop: 6, color: "#666" }}>Chitti is thinking…</div>
        ) : chittiView ? (
          <>
            <div style={{
              marginTop: 6, fontSize: 22, fontWeight: 700,
              color: chittiView.verdict === 'BUY'  ? '#0f5132'
                   : chittiView.verdict === 'SELL' ? '#842029'
                   : '#0c4a6e',
            }}>{chittiView.verdict}</div>
            <div style={{ marginTop: 6, color: '#0c4a6e', lineHeight: 1.55 }}>{chittiView.summary}</div>
          </>
        ) : (
          <><br /><span style={{ color: "#666" }}>Coming soon — plain-English verdict on this stock based on the multi-timeframe Roshan signal.</span></>
        )}
      </div>

      {loading && (
        <div style={{ marginTop: 12, fontSize: 13, color: "#888" }}>Loading {tf} data…</div>
      )}
    </div>
  );
}

// ===== helpers =====

function computeRSI(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gain += diff; else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function computeSMA(arr, period = 20) {
  const out = new Array(arr.length).fill(null);
  let sum = 0; let count = 0;
  const buf = [];
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v == null || Number.isNaN(v)) { buf.push(null); continue; }
    buf.push(v);
    sum += v; count += 1;
    if (count > period) {
      // remove oldest non-null
      for (let j = i - 1; j >= 0; j--) {
        if (buf[j] != null) { sum -= buf[j]; count -= 1; buf[j] = null; break; }
      }
    }
    if (count === period) out[i] = sum / period;
  }
  return out;
}

function dateStrToUnix(d) {
  // d = "YYYY-MM-DD"
  const [y, m, day] = d.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, day) / 1000);
}

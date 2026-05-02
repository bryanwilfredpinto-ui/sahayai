// chitti-shares/frontend/src/pages/Scanner.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "https://chitti-shares-api.onrender.com";

const NEW_IND = new Set([
  "TTM Squeeze","Awesome Oscillator","Vortex Indicator",
  "Chandelier Exit","Hull MA","Laguerre RSI",
  "Heikin Ashi Trend","Balance of Power","Chande Kroll Stop",
]);

const INDICATORS = [
  { group: "⭐ Chitti Special", items: [
    { value: "Roshan Indicator", label: "Roshan Indicator (default)" },
  ]},
  { group: "⚡ New (2010–2026)", items: [
    { value: "TTM Squeeze",        label: "⚡ TTM Squeeze (2010+)" },
    { value: "Awesome Oscillator", label: "⚡ Awesome Oscillator (2010+)" },
    { value: "Vortex Indicator",   label: "⚡ Vortex Indicator (2010+)" },
    { value: "Chandelier Exit",    label: "⚡ Chandelier Exit (2010+)" },
    { value: "Hull MA",            label: "⚡ Hull MA (2012+)" },
    { value: "Laguerre RSI",       label: "⚡ Laguerre RSI (2012+)" },
    { value: "Heikin Ashi Trend",  label: "⚡ Heikin Ashi Trend (2010+)" },
    { value: "Balance of Power",   label: "⚡ Balance of Power (2010+)" },
    { value: "Chande Kroll Stop",  label: "⚡ Chande Kroll Stop (2021)" },
  ]},
  { group: "── Momentum ──", items: [
    { value: "RSI",                 label: "RSI (14)" },
    { value: "Stochastic",          label: "Stochastic" },
    { value: "Stochastic RSI",      label: "Stochastic RSI" },
    { value: "Williams %R",         label: "Williams %R" },
    { value: "CCI",                 label: "CCI" },
    { value: "ROC",                 label: "ROC" },
    { value: "Momentum",            label: "Momentum" },
    { value: "TRIX",                label: "TRIX" },
    { value: "Ultimate Oscillator", label: "Ultimate Oscillator" },
  ]},
  { group: "── Trend ──", items: [
    { value: "MACD",          label: "MACD" },
    { value: "ADX",           label: "ADX" },
    { value: "Aroon",         label: "Aroon" },
    { value: "Parabolic SAR", label: "Parabolic SAR" },
    { value: "Supertrend",    label: "Supertrend" },
    { value: "Ichimoku",      label: "Ichimoku" },
    { value: "Elder Ray",     label: "Elder Ray" },
    { value: "Elder Impulse", label: "Elder Impulse" },
  ]},
  { group: "── Volatility ──", items: [
    { value: "Bollinger Bands",   label: "Bollinger Bands" },
    { value: "ATR",               label: "ATR" },
    { value: "Keltner Channels",  label: "Keltner Channels" },
    { value: "Donchian Channels", label: "Donchian Channels" },
  ]},
  { group: "── Volume ──", items: [
    { value: "OBV",                       label: "OBV" },
    { value: "Force Index",               label: "Force Index" },
    { value: "Accumulation/Distribution", label: "Accumulation/Distribution" },
    { value: "Chaikin Money Flow",        label: "Chaikin Money Flow" },
    { value: "MFI",                       label: "MFI" },
    { value: "VWAP",                      label: "VWAP" },
  ]},
  { group: "── Moving Averages ──", items: [
    { value: "SMA(20)",  label: "SMA (20)" },
    { value: "SMA(50)",  label: "SMA (50)" },
    { value: "SMA(200)", label: "SMA (200)" },
    { value: "EMA(20)",  label: "EMA (20)" },
    { value: "EMA(50)",  label: "EMA (50)" },
    { value: "EMA(200)", label: "EMA (200)" },
  ]},
];

const CALLS = ["Long-term", "Positional", "Swing", "Intraday"];
const UNIVERSES = [
  { value: "nifty50", label: "Nifty 50" },
  { value: "largecap", label: "Largecap" },
  { value: "midcap", label: "Midcap" },
  { value: "smallcap", label: "Smallcap" },
  { value: "microcap", label: "Microcap" },
];
const REFRESH_OPTS = [5, 15, 30, 60];

const IND_PLAIN = {
  "TTM Squeeze":        "⚡ NEW — Bollinger inside Keltner = coiled spring. Fires = big move. Above zero = BUY.",
  "Awesome Oscillator": "⚡ NEW — Compares recent vs historical momentum. Above zero = buyers winning = BUY.",
  "Vortex Indicator":   "⚡ NEW — Two lines. Up-line above down-line = BUY signal.",
  "Chandelier Exit":    "⚡ NEW — ATR trailing stop. Price above stop line = BUY. Below = exit.",
  "Hull MA":            "⚡ NEW — Faster moving average, less lag than EMA. Price above HMA = BUY.",
  "Laguerre RSI":       "⚡ NEW — Smarter RSI, fewer false signals. Above 0.5 = BUY.",
  "Heikin Ashi Trend":  "⚡ NEW — Smoothed candles, filters noise. 3 green candles in a row = BUY.",
  "Balance of Power":   "⚡ NEW — Buyers vs sellers each candle. Above zero = buyers winning = BUY.",
  "Chande Kroll Stop":  "⚡ NEW (2021) — Advanced trailing stop. Price above stop = BUY.",
  "Roshan Indicator": "Checks RSI momentum + candle direction on 2 timeframes. All must agree.",
  "RSI": "Speed of price. Below 30 = may rise. Above 70 = may fall.",
  "MACD": "Fast trend vs slow. When fast crosses slow upward = BUY.",
  "Force Index": "Price move x volume. Above zero = buyers in control.",
  "Supertrend": "Line flips green or red. Price above = BUY. Below = SHORT.",
  "Bollinger Bands": "Price bands. Touch lower = may bounce up. Touch upper = may fall.",
  "OBV": "Volume direction. Rising = buyers accumulating.",
  "VWAP": "Average price by volume. Price above = strong buyers today.",
  "ADX": "Trend strength. Above 25 = strong trend.",
  "Stochastic": "Momentum. Below 20 = oversold. Above 80 = overbought.",
  "Ichimoku": "Cloud of support/resistance. Price above green cloud = uptrend.",
};
function getPlain(ind) { return IND_PLAIN[ind] || "Detects BUY or SHORT signals from price movement."; }

export default function Scanner() {
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState("Roshan Indicator");
  const [call, setCall] = useState("Positional");
  const [universe, setUniverse] = useState("nifty50");
  const [refreshMin, setRefreshMin] = useState(15);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [cacheAge, setCacheAge] = useState(null);
  const intervalRef = useRef(null);

  async function runScan(force = false) {
    setLoading(true); setErr("");
    try {
      const isRoshan = indicator === "Roshan Indicator";
      const endpoint = isRoshan ? "roshan" : encodeURIComponent(indicator);
      const url = `${API_BASE}/api/scan/${endpoint}?call=${encodeURIComponent(call)}&universe=${encodeURIComponent(universe)}&force=${force}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
      setCacheAge(json.cache_age_sec ?? null);
    } catch(e) {
      setErr(e.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { runScan(false); }, []);
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => runScan(false), refreshMin * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [refreshMin]);
  useEffect(() => {
    if (cacheAge === null) return;
    const t = setInterval(() => setCacheAge(a => a === null ? null : a + 1), 1000);
    return () => clearInterval(t);
  }, [cacheAge]);

  const buys = data?.buys || [];
  const shorts = data?.shorts || [];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>

        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0f172a" }}>Chitti Scanner</h1>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Select any indicator. Chitti scans all stocks and shows BUY + SHORT signals.</p>
        </div>

        <div style={{ padding: "6px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, fontSize: 11, color: "#92400e", marginBottom: 12 }}>
          ⚠️ <b>Not SEBI Registered.</b> Educational tool only. Not investment advice. | <b>SEBI पंजीकृत नहीं।</b> यह निवेश सलाह नहीं है।
        </div>

        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Indicator</label>
            <select value={indicator} onChange={e => setIndicator(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 6, border: "1px solid #cbd5e1" }}>
              {INDICATORS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div style={{
              marginTop: 6, fontSize: 11, borderRadius: 4, padding: "5px 8px",
              background: NEW_IND.has(indicator) ? "#fefce8" : "#f8fafc",
              border: NEW_IND.has(indicator) ? "1px solid #fde68a" : "none",
              color: NEW_IND.has(indicator) ? "#92400e" : "#64748b",
            }}>
              {NEW_IND.has(indicator) ? "⚡" : "💡"} {getPlain(indicator)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Call Type", val: call, set: setCall, opts: CALLS.map(c => ({value:c,label:c})) },
              { label: "Universe",  val: universe, set: setUniverse, opts: UNIVERSES },
              { label: "Auto Refresh", val: refreshMin, set: v => setRefreshMin(Number(v)), opts: REFRESH_OPTS.map(n => ({value:n,label:`${n} min`})) },
            ].map(({label, val, set, opts}) => (
              <div key={label} style={{ flex: 1, minWidth: 100 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>
                <select value={val} onChange={e => set(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, borderRadius: 6, border: "1px solid #cbd5e1" }}>
                  {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button onClick={() => runScan(true)} disabled={loading}
            style={{ marginTop: 12, width: "100%", padding: 10, fontSize: 14, fontWeight: 700,
              borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#94a3b8" : "#0f5132", color: "white" }}>
            {loading ? "⏳ Scanning…" : `▶ Scan — ${indicator}`}
          </button>
        </div>

        {data && (
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>✅ Scanned <b>{data.scanned_count}</b> stocks</span>
            <span>🕐 {data.scanned_at ? new Date(data.scanned_at).toLocaleTimeString() : "—"}</span>
            <span>{data.from_cache ? `📦 Cached (${cacheAge}s)` : "🔄 Fresh"}</span>
            <span>⏱ {data.scan_duration_sec}s</span>
          </div>
        )}

        {err && (
          <div style={{ padding: "10px 14px", marginBottom: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 6, fontSize: 13 }}>
            ❌ {err} — <button onClick={() => runScan(true)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", textDecoration: "underline" }}>Retry</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <ResultColumn title="BUY" tone="buy" stocks={buys} loading={loading}
            onClickStock={sym => navigate(`/chart/${encodeURIComponent(sym)}`)} />
          <ResultColumn title="SHORT" tone="short" stocks={shorts} loading={loading}
            onClickStock={sym => navigate(`/chart/${encodeURIComponent(sym)}`)} />
        </div>
      </div>
    </div>
  );
}

function ResultColumn({ title, tone, stocks, loading, onClickStock }) {
  const isBuy = tone === "buy";
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ background: isBuy ? "#0f5132" : "#9f1239", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{isBuy ? "▲" : "▼"} {title}</span>
        <span style={{ background: "rgba(255,255,255,0.2)", color: "white", borderRadius: 20, padding: "1px 8px", fontSize: 11 }}>{stocks.length}</span>
      </div>
      <div>
        {loading && stocks.length === 0 && <Skeleton />}
        {!loading && stocks.length === 0 && (
          <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>No {title} signals found</div>
        )}
        {stocks.map((s, i) => (
          <button key={s.symbol || i} onClick={() => onClickStock(s.symbol)}
            aria-label={`${(s.symbol||"").split(":").pop()}, ${isBuy?"buy":"short"} signal`}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: "white", border: "none", borderBottom: "1px solid #f1f5f9", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = isBuy ? "#f0fdf4" : "#fff1f2"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{(s.symbol||"").split(":").pop()}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.symbol}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              {s.last_price != null && <div style={{ fontSize: 13, fontWeight: 600 }}>₹{Number(s.last_price).toLocaleString("en-IN",{minimumFractionDigits:2})}</div>}
              {s.pchange != null && <div style={{ fontSize: 11, color: s.pchange>=0?"#15803d":"#be123c", fontWeight:600 }}>{s.pchange>=0?"+":""}{Number(s.pchange).toFixed(2)}%</div>}
              <div style={{ fontSize: 10, fontWeight: 700, color: isBuy?"#15803d":"#be123c" }}>{isBuy?"▲ BUY":"▼ SHORT"}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <div><div style={{ height:12, width:80, background:"#e2e8f0", borderRadius:4 }}/><div style={{ height:10, width:50, background:"#f1f5f9", borderRadius:4, marginTop:6 }}/></div>
          <div><div style={{ height:12, width:60, background:"#e2e8f0", borderRadius:4 }}/><div style={{ height:10, width:40, background:"#f1f5f9", borderRadius:4, marginTop:6 }}/></div>
        </div>
      ))}
    </div>
  );
}

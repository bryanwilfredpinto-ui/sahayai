// chitti-shares/frontend/src/pages/Technical.jsx
//
// Box 3 — Technical Analysis page.
// Self-contained. Drop into pages/ folder, add one route in App.jsx.
//
// What it does:
//   1. User types a stock symbol (default RELIANCE)
//   2. Multi-select dropdown of 34 indicators (default: 5 popular ones ticked)
//   3. Click "Analyze" -> calls /api/technical/{symbol} on backend
//   4. Renders a grid: rows = indicators, cols = 5 timeframes
//   5. Below the grid: 3 multi-timeframe calls (Long-term, Positional, Intraday)
//
// No external libs needed beyond React + fetch.

import { useState } from "react";

// Match what backend technical.py exports as ALL_INDICATORS
const ALL_INDICATORS = [
  // Momentum
  "RSI", "Stochastic", "Stochastic RSI", "Williams %R", "CCI", "ROC",
  "Momentum", "TRIX", "Ultimate Oscillator", "Roshan Indicator",
  // Trend
  "MACD", "ADX", "Aroon", "Parabolic SAR", "Supertrend",
  "Ichimoku", "Elder Ray", "Elder Impulse",
  // Volatility
  "Bollinger Bands", "ATR", "Keltner Channels", "Donchian Channels",
  // Volume
  "OBV", "Force Index", "Accumulation/Distribution",
  "Chaikin Money Flow", "MFI", "VWAP",
  // Moving Averages
  "SMA(20)", "SMA(50)", "SMA(200)", "EMA(20)", "EMA(50)", "EMA(200)",
];

const DEFAULT_PICKED = ["RSI", "MACD", "Roshan Indicator", "Bollinger Bands", "Supertrend"];

const TIMEFRAMES = ["Monthly", "Weekly", "Daily", "4H", "1H"];

const CALL_PAIRS = {
  "Long-term": ["Monthly", "Weekly"],
  "Positional": ["Weekly", "Daily"],
  "Intraday": ["4H", "1H"],
};

// Backend URL — configurable via env var; falls back to known prod URL
const API_BASE =
  import.meta.env?.VITE_API_BASE || "https://chitti-shares-api-production.up.railway.app";

function signalColor(sig) {
  if (sig === "BUY") return { background: "#0f5132", color: "#d1e7dd" };
  if (sig === "SELL") return { background: "#842029", color: "#f8d7da" };
  if (sig === "HIDDEN" || sig === "MIXED")
    return { background: "#664d03", color: "#fff3cd" };
  return { background: "#333", color: "#aaa" };
}

function callColor(verdict) {
  if (verdict === "BUY") return "#0f5132";
  if (verdict === "SELL") return "#842029";
  return "#664d03"; // HIDDEN / MIXED
}

export default function Technical() {
  const [symbol, setSymbol] = useState("NSE:RELIANCE");
  const [picked, setPicked] = useState(DEFAULT_PICKED);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  function togglePick(ind) {
    setPicked((p) =>
      p.includes(ind) ? p.filter((x) => x !== ind) : [...p, ind]
    );
  }

  async function runAnalysis() {
    setLoading(true);
    setErr("");
    setReport(null);
    try {
      const indicatorsParam = picked.join(",");
      const url = `${API_BASE}/api/technical/${encodeURIComponent(
        symbol
      )}?indicators=${encodeURIComponent(indicatorsParam)}`;
      const r = await fetch(url);
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || `HTTP ${r.status}`);
      }
      setReport(await r.json());
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>📊 Technical Analysis</h1>
      <p style={styles.sub}>
        Pick a stock, pick which indicators matter to you, see the verdict
        across 5 timeframes.
      </p>

      {/* Symbol + Run row */}
      <div style={styles.row}>
        <input
          style={styles.input}
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="e.g. NSE:RELIANCE, NSE:NIFTY 50, BSE:SENSEX"
        />
        <button style={styles.btn} onClick={runAnalysis} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* Indicator dropdown */}
      <div style={{ marginTop: 16 }}>
        <button
          style={styles.dropdownToggle}
          onClick={() => setShowDropdown((s) => !s)}
        >
          Indicators ({picked.length} of {ALL_INDICATORS.length} selected) ▾
        </button>
        {showDropdown && (
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              <button
                style={styles.smallBtn}
                onClick={() => setPicked([...ALL_INDICATORS])}
              >
                Select all
              </button>
              <button
                style={styles.smallBtn}
                onClick={() => setPicked([])}
              >
                Clear all
              </button>
              <button
                style={styles.smallBtn}
                onClick={() => setPicked(DEFAULT_PICKED)}
              >
                Defaults
              </button>
            </div>
            <div style={styles.dropdownGrid}>
              {ALL_INDICATORS.map((ind) => (
                <label key={ind} style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={picked.includes(ind)}
                    onChange={() => togglePick(ind)}
                  />
                  <span style={{ marginLeft: 6 }}>{ind}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {err && (
        <div style={styles.err}>Error: {err}</div>
      )}

      {/* Results */}
      {report && (
        <>
          <h2 style={styles.h2}>Timeframe grid — {report.symbol}</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Indicator</th>
                  {TIMEFRAMES.map((tf) => (
                    <th key={tf} style={styles.th}>{tf}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {picked.map((ind) => (
                  <tr key={ind}>
                    <td style={styles.tdName}>{ind}</td>
                    {TIMEFRAMES.map((tf) => {
                      const cell = report.timeframes?.[tf]?.[ind];
                      const sig = cell?.signal || "WAIT";
                      const val = cell?.value;
                      return (
                        <td key={tf} style={{ ...styles.td, ...signalColor(sig) }}>
                          <div style={{ fontWeight: "bold" }}>{sig}</div>
                          <div style={styles.cellVal}>
                            {val == null ? "—" : Number(val).toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* The 3 calls */}
          <h2 style={styles.h2}>📞 Chitti's Calls</h2>
          <div style={styles.callsGrid}>
            {Object.entries(CALL_PAIRS).map(([callName, pair]) => {
              const callData = report.calls?.[callName] || {};
              const verdicts = picked.map((ind) => callData[ind] || "HIDDEN");
              const allBuy = verdicts.every((v) => v === "BUY");
              const allSell = verdicts.every((v) => v === "SELL");
              const overall = allBuy ? "BUY" : allSell ? "SELL" : "MIXED";
              const buyCount = verdicts.filter((v) => v === "BUY").length;
              const sellCount = verdicts.filter((v) => v === "SELL").length;
              return (
                <div
                  key={callName}
                  style={{ ...styles.callCard, borderColor: callColor(overall) }}
                >
                  <div style={styles.callTitle}>{callName}</div>
                  <div style={styles.callPair}>
                    {pair[0]} + {pair[1]}
                  </div>
                  <div
                    style={{ ...styles.callVerdict, background: callColor(overall) }}
                  >
                    {overall}
                  </div>
                  <div style={styles.callDetail}>
                    {buyCount} BUY · {sellCount} SELL · {verdicts.length - buyCount - sellCount} mixed
                  </div>
                  <div style={styles.callIndicators}>
                    {picked.map((ind) => (
                      <div key={ind} style={styles.callRow}>
                        <span>{ind}</span>
                        <span style={{ color: callColor(callData[ind]) }}>
                          {callData[ind] || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chitti's view placeholder for Layer 2 */}
          <div style={styles.chittiView}>
            <div style={styles.chittiTitle}>💬 Chitti's View</div>
            <div style={styles.chittiBody}>
              <em>
                Coming in Layer 2 — Chitti will read the grid above and explain
                what to do in plain English.
              </em>
            </div>
          </div>

          <div style={styles.meta}>
            Generated at: {report.generated_at}
          </div>
        </>
      )}
    </div>
  );
}

// ---- styles (inline, dark theme matching dashboard) ----
const styles = {
  page: { padding: 20, color: "#eee", background: "#0b0b0e", minHeight: "100vh", fontFamily: "system-ui, sans-serif" },
  h1: { fontSize: 28, marginBottom: 4 },
  h2: { fontSize: 20, marginTop: 28, marginBottom: 12 },
  sub: { color: "#888", marginBottom: 20 },
  row: { display: "flex", gap: 8 },
  input: { flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #333", background: "#1a1a1f", color: "#fff", fontSize: 14 },
  btn: { padding: "10px 20px", borderRadius: 8, border: "none", background: "#3b82f6", color: "white", cursor: "pointer", fontWeight: 600 },
  dropdownToggle: { padding: "8px 14px", borderRadius: 8, border: "1px solid #333", background: "#1a1a1f", color: "#eee", cursor: "pointer" },
  dropdown: { marginTop: 8, padding: 12, background: "#15151a", border: "1px solid #333", borderRadius: 8 },
  dropdownHeader: { display: "flex", gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #333" },
  dropdownGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 6 },
  checkLabel: { display: "flex", alignItems: "center", padding: 4, fontSize: 13, color: "#ddd", cursor: "pointer" },
  smallBtn: { padding: "4px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #444", background: "#222", color: "#eee", cursor: "pointer" },
  err: { marginTop: 12, padding: 12, background: "#3a1414", border: "1px solid #842029", borderRadius: 8, color: "#f8d7da" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
  th: { padding: 10, textAlign: "left", borderBottom: "1px solid #333", color: "#aaa", fontSize: 13 },
  td: { padding: 10, textAlign: "center", borderBottom: "1px solid #222", fontSize: 13 },
  tdName: { padding: 10, borderBottom: "1px solid #222", fontSize: 13, color: "#ddd", fontWeight: 500 },
  cellVal: { fontSize: 11, opacity: 0.7, marginTop: 2 },
  callsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 },
  callCard: { padding: 16, background: "#15151a", border: "2px solid #333", borderRadius: 12 },
  callTitle: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  callPair: { fontSize: 12, color: "#888", marginBottom: 12 },
  callVerdict: { display: "inline-block", padding: "6px 16px", borderRadius: 8, fontWeight: 700, fontSize: 16, color: "#fff" },
  callDetail: { marginTop: 8, fontSize: 12, color: "#aaa" },
  callIndicators: { marginTop: 12, paddingTop: 12, borderTop: "1px solid #222" },
  callRow: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 },
  chittiView: { marginTop: 24, padding: 16, background: "#15151a", border: "1px solid #333", borderRadius: 12 },
  chittiTitle: { fontSize: 16, fontWeight: 600, marginBottom: 8 },
  chittiBody: { fontSize: 14, color: "#bbb", lineHeight: 1.6 },
  meta: { marginTop: 16, fontSize: 11, color: "#555", textAlign: "right" },
};

// chitti-shares/frontend/src/pages/Scanner.jsx
//
// Roshan Scanner page (Box 3 main entry).

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://chitti-shares-api.onrender.com";

const CALLS = ["Long-term", "Positional", "Swing", "Intraday"];
const UNIVERSES = [
  { value: "nifty50",  label: "Nifty 50" },
  { value: "largecap", label: "Largecap" },
  { value: "midcap",   label: "Midcap" },
  { value: "smallcap", label: "Smallcap" },
  { value: "microcap", label: "Microcap" },
];
const REFRESH_OPTS = [5, 15, 30, 60];

const COLOR_BUY_BG     = "#e8f3ec";
const COLOR_BUY_HEAD   = "#0f5132";
const COLOR_SHORT_BG   = "#fbeaec";
const COLOR_SHORT_HEAD = "#842029";

export default function Scanner() {
  const navigate = useNavigate();
  const [indicator] = useState("Roshan");
  const [call, setCall]         = useState("Positional");
  const [universe, setUniverse] = useState("nifty50");
  const [refreshMin, setRefreshMin] = useState(15);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");
  const [cacheAge, setCacheAge] = useState(null);
  const intervalRef = useRef(null);

  async function runScan(forceRefresh = false) {
    setLoading(true);
    setErr("");
    try {
      const url =
        `${API_BASE}/api/scan/roshan` +
        `?call=${encodeURIComponent(call)}` +
        `&universe=${encodeURIComponent(universe)}` +
        `&force=${forceRefresh ? "true" : "false"}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
      setCacheAge(json.cache_age_sec ?? null);
    } catch (e) {
      setErr(e.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { runScan(false); }, [call, universe]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => runScan(false), refreshMin * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refreshMin, call, universe]);

  useEffect(() => {
    if (cacheAge === null) return;
    const t = setInterval(() => setCacheAge((a) => (a === null ? null : a + 1)), 1000);
    return () => clearInterval(t);
  }, [cacheAge]);

  const buys   = data?.buys   || [];
  const shorts = data?.shorts || [];

  return (
    <div style={{ padding: "16px 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Roshan Scanner</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16, padding: 12, background: "#f7f7f8", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <Dropdown label="Indicator" value={indicator} disabled options={[{ value: "Roshan", label: "Roshan" }]} />
        <Dropdown label="Call" value={call} onChange={setCall} options={CALLS.map(c => ({ value: c, label: c }))} />
        <Dropdown label="Universe" value={universe} onChange={setUniverse} options={UNIVERSES} />
        <Dropdown label="Refresh" value={refreshMin} onChange={(v) => setRefreshMin(Number(v))} options={REFRESH_OPTS.map(n => ({ value: n, label: `${n} min` }))} />
        <button onClick={() => runScan(true)} disabled={loading} style={{ padding: "8px 16px", border: "1px solid #0f5132", background: "#0f5132", color: "white", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer", fontWeight: 500, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Scanning..." : "Scan now"}
        </button>
      </div>
      {data && (
        <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
          Scanned <b>{data.scanned_count}</b> stocks ·{" "}
          Last update {data.scanned_at ? new Date(data.scanned_at).toLocaleTimeString() : "\u2014"} ·{" "}
          Cache age {cacheAge != null ? `${cacheAge}s` : "\u2014"}{data.from_cache ? " (cached)" : " (fresh)"}
        </div>
      )}
      {err && (
        <div style={{ padding: 12, marginBottom: 12, background: "#fbeaec", border: "1px solid #842029", color: "#842029", borderRadius: 6 }}>
          Error: {err}{" "}<button onClick={() => runScan(true)} style={{ marginLeft: 8, textDecoration: "underline", background: "none", border: "none", color: "#842029", cursor: "pointer" }}>Retry</button>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
        <Column title={`BUY (${buys.length})`} headColor={COLOR_BUY_HEAD} bg={COLOR_BUY_BG} stocks={buys} loading={loading} onClickStock={(sym) => navigate(`/chart/${encodeURIComponent(sym)}`)} />
        <Column title={`SHORT (${shorts.length})`} headColor={COLOR_SHORT_HEAD} bg={COLOR_SHORT_BG} stocks={shorts} loading={loading} onClickStock={(sym) => navigate(`/chart/${encodeURIComponent(sym)}`)} />
      </div>
    </div>
  );
}

function Dropdown({ label, value, onChange, options, disabled }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", fontSize: 12, color: "#555" }}>
      <span style={{ marginBottom: 4 }}>{label}</span>
      <select value={value} disabled={disabled} onChange={(e) => onChange && onChange(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 4, background: disabled ? "#f0f0f0" : "white", fontSize: 14, minWidth: 130, cursor: disabled ? "not-allowed" : "pointer" }}>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </label>
  );
}

function Column({ title, headColor, bg, stocks, loading, onClickStock }) {
  return (
    <div style={{ background: bg, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", minHeight: 300 }}>
      <div style={{ background: headColor, color: "white", padding: "10px 14px", fontWeight: 600, fontSize: 15 }}>{title}</div>
      <div style={{ padding: 4 }}>
        {loading && stocks.length === 0 && <Skeleton />}
        {!loading && stocks.length === 0 && (
          <div style={{ padding: 16, color: "#888", fontSize: 13, textAlign: "center" }}>No qualifying stocks for this scan</div>
        )}
        {stocks.map((s, i) => (<Row key={s.symbol || i} stock={s} onClick={() => onClickStock(s.symbol)} />))}
      </div>
    </div>
  );
}

function Row({ stock, onClick }) {
  const sym  = stock.symbol || "";
  const name = stock.name || sym.split(":").pop();
  const last = stock.last_price ?? stock.price ?? null;
  const pch  = stock.pchange ?? stock.change_pct ?? null;
  const pchColor = pch == null ? "#777" : pch >= 0 ? "#0f5132" : "#842029";
  return (
    <div onClick={onClick} style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "10px 12px", margin: "4px 0", background: "white", borderRadius: 6, cursor: "pointer", border: "1px solid transparent" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#bbb"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 11, color: "#888" }}>{sym}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{last != null ? `\u20B9${Number(last).toFixed(2)}` : "\u2014"}</div>
        {pch != null && (<div style={{ fontSize: 12, color: pchColor }}>{pch >= 0 ? "+" : ""}{Number(pch).toFixed(2)}%</div>)}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ height: 48, margin: "4px 0", background: "#fff", borderRadius: 6, opacity: 0.6 }} />
      ))}
    </>
  );
}

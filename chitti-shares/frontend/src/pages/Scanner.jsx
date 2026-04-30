// chitti-shares/frontend/src/pages/Scanner.jsx
//
// Roshan Scanner — production polish.
// Design references: Tickertape header style, Kite table density, Chartink
// scan-results pattern. Tailwind utility classes only; no inline styles.
//
// Functional contract is unchanged from the previous version:
//   - Dropdowns DO NOT auto-trigger scans. Only "Scan now" + initial mount
//     + auto-refresh interval trigger fetches.
//   - Two columns: BUY (left) and SHORT (right).
//   - Click a stock row -> /chart/{symbol}.

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

  useEffect(() => { runScan(false); }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => runScan(false), refreshMin * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refreshMin]);

  useEffect(() => {
    if (cacheAge === null) return;
    const t = setInterval(() => setCacheAge((a) => (a === null ? null : a + 1)), 1000);
    return () => clearInterval(t);
  }, [cacheAge]);

  const buys   = data?.buys   || [];
  const shorts = data?.shorts || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 [font-family:system-ui,'Segoe_UI',Roboto,sans-serif] [font-feature-settings:'tnum']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight">Roshan Scanner</h1>
          <p className="text-sm text-slate-500 mt-1">
            Multi-timeframe technical scan. BUY and SHORT columns refresh on demand.
          </p>
        </div>

        {/* Controls card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <Dropdown label="Indicator" value={indicator} disabled
                      options={[{ value: "Roshan", label: "Roshan" }]} />
            <Dropdown label="Call" value={call} onChange={setCall}
                      options={CALLS.map(c => ({ value: c, label: c }))} />
            <Dropdown label="Universe" value={universe} onChange={setUniverse}
                      options={UNIVERSES} />
            <Dropdown label="Auto-refresh" value={refreshMin}
                      onChange={(v) => setRefreshMin(Number(v))}
                      options={REFRESH_OPTS.map(n => ({ value: n, label: `${n} min` }))} />
            <button
              onClick={() => runScan(true)}
              disabled={loading}
              className={
                "ml-auto inline-flex items-center justify-center gap-1.5 " +
                "px-4 py-2 rounded-md text-sm font-medium " +
                "border border-emerald-800 bg-emerald-800 text-white " +
                "hover:bg-emerald-900 active:bg-emerald-950 " +
                "transition-colors duration-100 " +
                "disabled:opacity-60 disabled:cursor-not-allowed"
              }
            >
              {loading ? (
                <>
                  <Spinner />
                  Scanning…
                </>
              ) : (
                "Scan now"
              )}
            </button>
          </div>
        </div>

        {/* Status strip */}
        {data && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
            <span>Scanned <span className="font-medium text-slate-700">{data.scanned_count}</span> stocks</span>
            <Dot />
            <span>Last update <span className="font-medium text-slate-700">{data.scanned_at ? new Date(data.scanned_at).toLocaleTimeString() : "—"}</span></span>
            <Dot />
            <span>Cache <span className="font-medium text-slate-700">{cacheAge != null ? `${cacheAge}s` : "—"}</span></span>
            <span className={data.from_cache ? "text-amber-700" : "text-emerald-700"}>
              {data.from_cache ? "(cached)" : "(fresh)"}
            </span>
          </div>
        )}

        {/* Error */}
        {err && (
          <div className="flex items-center gap-3 p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-md text-sm">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            <span className="flex-1">Error: {err}</span>
            <button onClick={() => runScan(true)}
                    className="text-xs font-medium underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Two-column results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Column
            title="BUY"
            count={buys.length}
            tone="buy"
            stocks={buys}
            loading={loading}
            onClickStock={(sym) => navigate(`/chart/${encodeURIComponent(sym)}`)}
          />
          <Column
            title="SHORT"
            count={shorts.length}
            tone="short"
            stocks={shorts}
            loading={loading}
            onClickStock={(sym) => navigate(`/chart/${encodeURIComponent(sym)}`)}
          />
        </div>
      </div>
    </div>
  );
}

function Dropdown({ label, value, onChange, options, disabled }) {
  return (
    <label className="flex flex-col gap-1 min-w-[140px]">
      <span className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={
          "px-3 py-2 text-sm rounded-md border border-slate-300 " +
          "bg-white text-slate-900 " +
          "hover:border-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 " +
          "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed " +
          "transition-colors duration-100"
        }
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Column({ title, count, tone, stocks, loading, onClickStock }) {
  const isBuy = tone === "buy";
  const headerColor = isBuy
    ? "bg-emerald-800 text-white"
    : "bg-rose-900 text-white";

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${headerColor}`}>
        <div className="flex items-center gap-2">
          {isBuy ? (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd"/></svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd"/></svg>
          )}
          <span className="font-semibold tracking-wide text-sm uppercase">{title}</span>
        </div>
        <span className="text-xs font-medium bg-white/20 rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {loading && stocks.length === 0 && <Skeleton />}
        {!loading && stocks.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-slate-400">
            No qualifying stocks for this scan
          </div>
        )}
        {stocks.map((s, i) => (
          <Row key={s.symbol || i} stock={s} tone={tone} onClick={() => onClickStock(s.symbol)} />
        ))}
      </div>
    </div>
  );
}

function Row({ stock, tone, onClick }) {
  const sym  = stock.symbol || "";
  const name = stock.name || sym.split(":").pop();
  const last = stock.last_price ?? stock.price ?? null;
  const pch  = stock.pchange ?? stock.change_pct ?? null;
  const isBuy = tone === "buy";
  const hoverBg = isBuy ? "hover:bg-emerald-50" : "hover:bg-rose-50";

  const pchClass =
    pch == null   ? "text-slate-400"
    : pch >= 0    ? "text-emerald-700 bg-emerald-50"
    :               "text-rose-700 bg-rose-50";

  return (
    <button
      onClick={onClick}
      className={
        "w-full flex items-center justify-between px-4 py-3 " +
        "text-left transition-colors duration-75 " +
        hoverBg + " active:bg-slate-100 " +
        "focus:outline-none focus:bg-slate-100"
      }
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900 truncate">{name}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{sym}</div>
      </div>
      <div className="text-right ml-3 flex-shrink-0">
        <div className="text-sm font-semibold text-slate-900">
          {last != null ? `\u20B9${Number(last).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
        </div>
        {pch != null && (
          <div className={`inline-block mt-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded ${pchClass}`}>
            {pch >= 0 ? "+" : ""}{Number(pch).toFixed(2)}%
          </div>
        )}
      </div>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {[0,1,2,3,4].map(i => (
        <div key={i} className="px-4 py-3 flex items-center justify-between animate-pulse">
          <div className="flex-1">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-2 w-16 bg-slate-100 rounded mt-2" />
          </div>
          <div className="text-right ml-3">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-2 w-10 bg-slate-100 rounded mt-2 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  );
}

function Dot() {
  return <span className="text-slate-300">·</span>;
}

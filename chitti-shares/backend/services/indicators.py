"""
services/indicators.py
----------------------
Pure-Python technical indicators. No pandas needed for these specific
calculations - we get speed wins only at 10k+ candles, which we never
hit (we use 50-500 candles).

Indicators implemented (per Phase 4 spec):
  - SMA(period)
  - EMA(period)
  - RSI(period)
  - MACD(fast, slow, signal)
  - Williams %R(period)
  - Force Index(period) - smoothed
  - Elder Ray (bull power, bear power, EMA13)

All take a list of candle dicts and return either a list (one value
per candle, with None for the warmup period) or a dict of lists.
"""

from __future__ import annotations


# ----- helpers -----

def _closes(candles: list[dict]) -> list[float]:
    return [c["close"] for c in candles]


def _highs(candles: list[dict]) -> list[float]:
    return [c["high"] for c in candles]


def _lows(candles: list[dict]) -> list[float]:
    return [c["low"] for c in candles]


def _vols(candles: list[dict]) -> list[float]:
    return [c.get("volume") or 0 for c in candles]


# ----- SMA / EMA -----

def sma(values: list[float], period: int) -> list[float | None]:
    out: list[float | None] = [None] * len(values)
    if len(values) < period:
        return out
    running = sum(values[:period])
    out[period - 1] = running / period
    for i in range(period, len(values)):
        running += values[i] - values[i - period]
        out[i] = running / period
    return out


def ema(values: list[float], period: int) -> list[float | None]:
    out: list[float | None] = [None] * len(values)
    if len(values) < period:
        return out
    alpha = 2 / (period + 1)
    seed = sum(values[:period]) / period
    out[period - 1] = seed
    prev = seed
    for i in range(period, len(values)):
        prev = alpha * values[i] + (1 - alpha) * prev
        out[i] = prev
    return out


# ----- RSI -----

def rsi(values: list[float], period: int = 14) -> list[float | None]:
    n = len(values)
    out: list[float | None] = [None] * n
    if n < period + 1:
        return out

    gains = 0.0
    losses = 0.0
    for i in range(1, period + 1):
        delta = values[i] - values[i - 1]
        if delta > 0: gains += delta
        else: losses += -delta
    avg_gain = gains / period
    avg_loss = losses / period

    out[period] = 100 - 100 / (1 + (avg_gain / avg_loss)) if avg_loss != 0 else 100

    for i in range(period + 1, n):
        delta = values[i] - values[i - 1]
        gain = max(delta, 0)
        loss = -min(delta, 0)
        # Wilder smoothing
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
        if avg_loss == 0:
            out[i] = 100
        else:
            rs = avg_gain / avg_loss
            out[i] = 100 - 100 / (1 + rs)
    return out


# ----- MACD -----

def macd(values: list[float], fast: int = 12, slow: int = 26, signal: int = 9) -> dict:
    fast_e = ema(values, fast)
    slow_e = ema(values, slow)
    macd_line: list[float | None] = []
    for f, s in zip(fast_e, slow_e):
        macd_line.append(f - s if (f is not None and s is not None) else None)
    # Signal line = EMA of macd_line (skip Nones)
    valid = [v for v in macd_line if v is not None]
    sig_valid = ema(valid, signal)
    # Pad signal back to original length
    pad = len(macd_line) - len(sig_valid)
    sig_full = [None] * pad + sig_valid
    hist = [
        (m - s) if (m is not None and s is not None) else None
        for m, s in zip(macd_line, sig_full)
    ]
    return {"macd": macd_line, "signal": sig_full, "hist": hist}


# ----- Williams %R -----

def williams_r(candles: list[dict], period: int = 14) -> list[float | None]:
    n = len(candles)
    out: list[float | None] = [None] * n
    if n < period:
        return out
    highs = _highs(candles)
    lows = _lows(candles)
    closes = _closes(candles)
    for i in range(period - 1, n):
        h = max(highs[i - period + 1: i + 1])
        l = min(lows[i - period + 1: i + 1])
        if h == l:
            out[i] = 0.0
        else:
            out[i] = -100 * (h - closes[i]) / (h - l)
    return out


# ----- Force Index -----

def force_index(candles: list[dict], period: int = 13) -> list[float | None]:
    n = len(candles)
    raw: list[float | None] = [None]
    closes = _closes(candles)
    vols = _vols(candles)
    for i in range(1, n):
        raw.append((closes[i] - closes[i - 1]) * vols[i])
    # EMA-smooth the raw force index
    valid = [v for v in raw if v is not None]
    smoothed = ema(valid, period)
    pad = len(raw) - len(smoothed)
    return [None] * pad + smoothed


# ----- Elder Ray (Bull Power / Bear Power) -----

def elder_ray(candles: list[dict], period: int = 13) -> dict:
    closes = _closes(candles)
    e = ema(closes, period)
    bull = []
    bear = []
    for i, c in enumerate(candles):
        ev = e[i]
        if ev is None:
            bull.append(None); bear.append(None)
        else:
            bull.append(c["high"] - ev)
            bear.append(c["low"] - ev)
    return {"bull_power": bull, "bear_power": bear, "ema": e}


# ----- Bollinger Bands (bonus, used by some custom rules) -----

def bollinger(values: list[float], period: int = 20, std_mult: float = 2.0) -> dict:
    s = sma(values, period)
    upper, lower = [], []
    for i in range(len(values)):
        if s[i] is None:
            upper.append(None); lower.append(None); continue
        window = values[i - period + 1: i + 1]
        mean = s[i]
        var = sum((v - mean) ** 2 for v in window) / period
        sd = var ** 0.5
        upper.append(mean + std_mult * sd)
        lower.append(mean - std_mult * sd)
    return {"middle": s, "upper": upper, "lower": lower}


# ----- ATR (Average True Range) -----

def atr(candles: list[dict], period: int = 14) -> list[float | None]:
    """Wilder's smoothed ATR. Used to size stops + targets."""
    n = len(candles)
    out: list[float | None] = [None] * n
    if n < period + 1:
        return out
    trs = []
    for i in range(1, n):
        h = candles[i]["high"]; l = candles[i]["low"]; pc = candles[i-1]["close"]
        tr = max(h - l, abs(h - pc), abs(l - pc))
        trs.append(tr)
    # First ATR = simple avg of first `period` TRs
    if len(trs) < period:
        return out
    seed = sum(trs[:period]) / period
    out[period] = seed
    prev = seed
    for i in range(period + 1, n):
        tr = trs[i - 1]
        prev = (prev * (period - 1) + tr) / period
        out[i] = prev
    return out


# ----- Auto Entry / Target / Stop Loss based on ATR -----

def entry_target_sl(candles: list[dict], summary: str,
                    atr_mult_target: float = 2.0,
                    atr_mult_sl: float = 1.0) -> dict | None:
    """
    Suggests an entry zone, target and stop loss using:
      - latest close as the entry midpoint
      - ATR(14) for distance sizing

    summary: "Strong Buy" / "Buy" / "Sell" / "Strong Sell" / "Neutral"
        Buy-side: target above, SL below
        Sell-side: target below, SL above
        Neutral: returns None (no call)
    """
    if len(candles) < 30 or summary == "Neutral" or summary == "Not enough data":
        return None
    a = atr(candles, 14)[-1]
    if a is None or a <= 0:
        return None
    last = candles[-1]["close"]

    # Entry zone = last close +/- 0.25 ATR (so traders have a band, not a single tick)
    entry_lo = last - 0.25 * a
    entry_hi = last + 0.25 * a

    if summary in ("Strong Buy", "Buy"):
        target = last + atr_mult_target * a
        stop_loss = last - atr_mult_sl * a
        side = "BUY"
    else:  # Sell / Strong Sell
        target = last - atr_mult_target * a
        stop_loss = last + atr_mult_sl * a
        side = "SELL"

    rr = abs(target - last) / abs(last - stop_loss) if abs(last - stop_loss) > 0 else None

    return {
        "side": side,
        "entry_low": _r(entry_lo),
        "entry_high": _r(entry_hi),
        "entry_mid": _r(last),
        "target": _r(target),
        "stop_loss": _r(stop_loss),
        "atr_14": _r(a),
        "risk_reward_ratio": _r(rr) if rr else None,
    }


# ----- One-shot bundle for a frontend "Technical Analysis" card -----

def compute_all(candles: list[dict]) -> dict:
    """
    Returns the latest value of every indicator + a summary signal.
    Frontend renders this directly.
    """
    if len(candles) < 30:
        return {
            "sma_20": None, "sma_50": None, "sma_200": None,
            "ema_13": None, "rsi_14": None,
            "macd": None, "macd_signal": None, "macd_hist": None,
            "williams_r_14": None,
            "force_index_13": None,
            "bull_power": None, "bear_power": None,
            "summary": "Not enough data",
        }

    closes = _closes(candles)
    sma20 = sma(closes, 20)[-1]
    sma50 = sma(closes, 50)[-1] if len(candles) >= 50 else None
    sma200 = sma(closes, 200)[-1] if len(candles) >= 200 else None
    ema13 = ema(closes, 13)[-1]
    rsi14 = rsi(closes, 14)[-1]
    macd_d = macd(closes)
    williams = williams_r(candles, 14)[-1]
    fi = force_index(candles, 13)[-1]
    er = elder_ray(candles, 13)
    bull = er["bull_power"][-1]
    bear = er["bear_power"][-1]

    # Summary - vote-based across signals
    votes = []
    if sma50 and closes[-1] > sma50: votes.append("up")
    elif sma50: votes.append("down")
    if rsi14:
        if rsi14 > 60: votes.append("up")
        elif rsi14 < 40: votes.append("down")
    if macd_d["hist"][-1] is not None:
        votes.append("up" if macd_d["hist"][-1] > 0 else "down")
    if bull is not None and bear is not None:
        if bull > 0 and bear > 0: votes.append("up")
        elif bull < 0 and bear < 0: votes.append("down")

    ups = votes.count("up")
    downs = votes.count("down")
    summary = (
        "Strong Buy" if ups >= 3 and downs == 0 else
        "Buy" if ups > downs else
        "Strong Sell" if downs >= 3 and ups == 0 else
        "Sell" if downs > ups else
        "Neutral"
    )

    return {
        "sma_20": _r(sma20),
        "sma_50": _r(sma50),
        "sma_200": _r(sma200),
        "ema_13": _r(ema13),
        "rsi_14": _r(rsi14),
        "macd": _r(macd_d["macd"][-1]),
        "macd_signal": _r(macd_d["signal"][-1]),
        "macd_hist": _r(macd_d["hist"][-1]),
        "williams_r_14": _r(williams),
        "force_index_13": _r(fi),
        "bull_power": _r(bull),
        "bear_power": _r(bear),
        "summary": summary,
        "votes": {"up": ups, "down": downs, "total": len(votes)},
    }


def _r(v):
    return None if v is None else round(v, 2)

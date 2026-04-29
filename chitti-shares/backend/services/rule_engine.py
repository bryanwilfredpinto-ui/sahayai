"""
services/rule_engine.py
-----------------------
Parses and evaluates user-defined trading rules like:

    RSI(14) > 60
    SMA(20) > SMA(50)
    PRICE > BB_UPPER(20, 2)
    MACD_HIST > 0 AND RSI(14) > 50
    RSI(14) > SMA(20 of RSI)        # nested - take SMA of the RSI series

Why a DSL and not Python eval()?
  - Safety: never run user input through eval. We tokenise + walk an AST.
  - Portability: same string works in DB, on UI, in alerts.

Grammar (informal):
  expr      := and_expr ( OR and_expr )*
  and_expr  := term ( AND term )*
  term      := comparison | "(" expr ")"
  comparison:= value op value
  op        := > | < | >= | <= | == | !=
  value     := NUMBER | indicator
  indicator := IDENT "(" args? ")"
  args      := arg ("," arg)*
  arg       := NUMBER | "of" series
  series    := IDENT "(" args? ")"   # for nested "SMA(20 of RSI(14))"

Supported indicators:
  PRICE, OPEN, HIGH, LOW, VOLUME
  SMA(period), EMA(period), RSI(period),
  MACD, MACD_SIGNAL, MACD_HIST,
  WILLIAMS_R(period), FORCE_INDEX(period),
  BB_UPPER(period, std), BB_LOWER(period, std),
  BULL_POWER, BEAR_POWER
"""

from __future__ import annotations

import re

from services import indicators


# ============ Tokeniser ============

TOKEN_RE = re.compile(
    r"\s*(?:"
    r"(?P<number>-?\d+(?:\.\d+)?)"
    r"|(?P<op><=|>=|==|!=|<|>)"
    r"|(?P<paren>[(),])"
    r"|(?P<ident>[A-Za-z_][A-Za-z_0-9]*)"
    r")"
)


def tokenise(text: str):
    pos = 0
    out = []
    while pos < len(text):
        m = TOKEN_RE.match(text, pos)
        if not m:
            if text[pos].isspace():
                pos += 1; continue
            raise ValueError(f"Unexpected char {text[pos]!r} at {pos}")
        if m.group("number"):
            out.append(("NUMBER", float(m.group("number"))))
        elif m.group("op"):
            out.append(("OP", m.group("op")))
        elif m.group("paren"):
            out.append(("PAREN", m.group("paren")))
        else:
            ident = m.group("ident").upper()
            if ident in {"AND", "OR", "OF"}:
                out.append((ident, ident))
            else:
                out.append(("IDENT", ident))
        pos = m.end()
    return out


# ============ Parser (recursive descent) ============

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else (None, None)

    def consume(self, kind=None, value=None):
        if self.pos >= len(self.tokens):
            raise ValueError("Unexpected end of expression")
        tok = self.tokens[self.pos]
        if kind and tok[0] != kind:
            raise ValueError(f"Expected {kind} got {tok}")
        if value is not None and tok[1] != value:
            raise ValueError(f"Expected {value} got {tok}")
        self.pos += 1
        return tok

    def parse(self):
        node = self.parse_or()
        if self.pos != len(self.tokens):
            raise ValueError(f"Trailing tokens: {self.tokens[self.pos:]}")
        return node

    def parse_or(self):
        left = self.parse_and()
        while self.peek() == ("OR", "OR"):
            self.consume("OR")
            right = self.parse_and()
            left = ("or", left, right)
        return left

    def parse_and(self):
        left = self.parse_term()
        while self.peek() == ("AND", "AND"):
            self.consume("AND")
            right = self.parse_term()
            left = ("and", left, right)
        return left

    def parse_term(self):
        if self.peek() == ("PAREN", "("):
            self.consume("PAREN", "(")
            node = self.parse_or()
            self.consume("PAREN", ")")
            return node
        return self.parse_comparison()

    def parse_comparison(self):
        left = self.parse_value()
        kind, val = self.peek()
        if kind != "OP":
            raise ValueError(f"Expected comparator, got {kind} {val}")
        self.consume("OP")
        right = self.parse_value()
        return ("cmp", val, left, right)

    def parse_value(self):
        kind, val = self.peek()
        if kind == "NUMBER":
            self.consume("NUMBER")
            return ("num", val)
        if kind == "IDENT":
            return self.parse_indicator()
        raise ValueError(f"Unexpected token in value: {kind} {val}")

    def parse_indicator(self):
        _, name = self.consume("IDENT")
        # Optional (args...)
        args = []
        of_series = None
        if self.peek() == ("PAREN", "("):
            self.consume("PAREN", "(")
            while True:
                kind, val = self.peek()
                if kind == "PAREN" and val == ")":
                    break
                if kind == "OF":
                    self.consume("OF")
                    of_series = self.parse_indicator()
                    continue
                if kind == "NUMBER":
                    self.consume("NUMBER")
                    args.append(val)
                else:
                    raise ValueError(f"Bad arg in {name}: {kind} {val}")
                if self.peek() == ("PAREN", ","):
                    self.consume("PAREN", ",")
            self.consume("PAREN", ")")
        return ("ind", name, args, of_series)


# ============ Evaluator ============

def _series_for(name: str, args, candles, of_series=None) -> list[float | None]:
    """Return a per-candle series for the given indicator."""
    if of_series is not None:
        # Apply outer indicator on top of inner indicator's series
        inner_name, inner_args, _ = of_series[1], of_series[2], of_series[3]
        inner = _series_for(inner_name, inner_args, candles)
        # Strip Nones for the outer pass, then pad back
        valid_idx = [i for i, v in enumerate(inner) if v is not None]
        valid_vals = [inner[i] for i in valid_idx]
        outer = _series_for(name, args, [{"close": v, "high": v, "low": v, "volume": 0} for v in valid_vals])
        # Map back
        full = [None] * len(candles)
        for i, src_i in enumerate(valid_idx):
            full[src_i] = outer[i]
        return full

    name = name.upper()
    closes = [c["close"] for c in candles]

    if name == "PRICE": return closes
    if name == "OPEN":  return [c["open"] for c in candles]
    if name == "HIGH":  return [c["high"] for c in candles]
    if name == "LOW":   return [c["low"] for c in candles]
    if name == "VOLUME":return [c.get("volume", 0) for c in candles]

    if name == "SMA":
        period = int(args[0]) if args else 20
        return indicators.sma(closes, period)
    if name == "EMA":
        period = int(args[0]) if args else 20
        return indicators.ema(closes, period)
    if name == "RSI":
        period = int(args[0]) if args else 14
        return indicators.rsi(closes, period)
    if name == "MACD":
        return indicators.macd(closes)["macd"]
    if name == "MACD_SIGNAL":
        return indicators.macd(closes)["signal"]
    if name == "MACD_HIST":
        return indicators.macd(closes)["hist"]
    if name == "WILLIAMS_R":
        period = int(args[0]) if args else 14
        return indicators.williams_r(candles, period)
    if name == "FORCE_INDEX":
        period = int(args[0]) if args else 13
        return indicators.force_index(candles, period)
    if name == "BB_UPPER":
        period = int(args[0]) if args else 20
        std = float(args[1]) if len(args) > 1 else 2.0
        return indicators.bollinger(closes, period, std)["upper"]
    if name == "BB_LOWER":
        period = int(args[0]) if args else 20
        std = float(args[1]) if len(args) > 1 else 2.0
        return indicators.bollinger(closes, period, std)["lower"]
    if name == "BULL_POWER":
        return indicators.elder_ray(candles, 13)["bull_power"]
    if name == "BEAR_POWER":
        return indicators.elder_ray(candles, 13)["bear_power"]

    raise ValueError(f"Unknown indicator: {name}")


def _eval_value(node, candles) -> float | None:
    kind = node[0]
    if kind == "num":
        return node[1]
    if kind == "ind":
        _, name, args, of_series = node
        series = _series_for(name, args, candles, of_series=of_series)
        return series[-1] if series else None
    raise ValueError(f"Bad value node {node}")


def _eval(node, candles) -> bool:
    kind = node[0]
    if kind == "and":
        return _eval(node[1], candles) and _eval(node[2], candles)
    if kind == "or":
        return _eval(node[1], candles) or _eval(node[2], candles)
    if kind == "cmp":
        _, op, l, r = node
        lv = _eval_value(l, candles)
        rv = _eval_value(r, candles)
        if lv is None or rv is None:
            return False
        return _COMPARE[op](lv, rv)
    raise ValueError(f"Bad node {node}")


_COMPARE = {
    ">":  lambda a, b: a > b,
    "<":  lambda a, b: a < b,
    ">=": lambda a, b: a >= b,
    "<=": lambda a, b: a <= b,
    "==": lambda a, b: abs(a - b) < 1e-9,
    "!=": lambda a, b: abs(a - b) >= 1e-9,
}


# ============ Public API ============

def parse(text: str):
    return Parser(tokenise(text)).parse()


def evaluate(text: str, candles: list[dict]) -> bool:
    ast = parse(text)
    return _eval(ast, candles)


def explain(text: str, candles: list[dict]) -> dict:
    """Return AST + the resolved values, useful for the UI 'why' panel."""
    ast = parse(text)
    trace = []

    def walk(node):
        if node[0] == "cmp":
            _, op, l, r = node
            lv = _eval_value(l, candles)
            rv = _eval_value(r, candles)
            trace.append({
                "left": _stringify(l),
                "op": op,
                "right": _stringify(r),
                "left_value": lv,
                "right_value": rv,
                "result": _COMPARE[op](lv, rv) if (lv is not None and rv is not None) else None,
            })
        elif node[0] in ("and", "or"):
            walk(node[1]); walk(node[2])

    walk(ast)
    return {
        "rule": text,
        "result": _eval(ast, candles),
        "trace": trace,
    }


def _stringify(node):
    if node[0] == "num":
        return str(node[1])
    if node[0] == "ind":
        _, name, args, of = node
        a = ", ".join(str(x) for x in args)
        if of is not None:
            return f"{name}({a} of {_stringify(of)})"
        return f"{name}({a})" if a else name
    return "?"

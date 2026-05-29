"""
lib/turso_http.py
-----------------
Minimal DBAPI 2.0 shim that speaks directly to Turso over HTTPS via the
`/v2/pipeline` Hrana endpoint. No local file, no embedded replica, no
background sync — every execute() is a round-trip to Turso and the row
lands in the canonical DB before the call returns.

Why a custom shim instead of `sqlalchemy-libsql` or `libsql-experimental`:
  - `libsql-experimental` is broken for our write path: SQLAlchemy writes
    via stdlib sqlite3 into the local replica's file, which produces WAL
    frames the libsql sync layer cannot reconcile (observed in Railway
    logs as `wal_insert_begin failed`). Container restart wipes /tmp and
    the data is lost.
  - `sqlalchemy-libsql==0.2.0` (currently pinned) sits on top of
    libsql-experimental and inherits the same failure mode in practice.
  - Direct HTTPS via /v2/pipeline has zero unknowns. Curl already proves
    CRUD + PRAGMA + sqlite_master all work. Latency is one HTTPS RTT per
    statement (~30 ms ap-south-1 ↔ asia-southeast1) — acceptable for this
    request volume.

Integration: SQLAlchemy uses the built-in `sqlite` dialect with a `creator=`
callable that returns one of our Connection objects. The shim implements
just enough of stdlib sqlite3's surface for the sqlite dialect to behave:
  - qmark paramstyle
  - PRAGMA passthrough (Turso accepts all the introspection PRAGMAs)
  - sqlite-flavoured exception types
  - executescript() for multi-statement DDL
  - autocommit semantics (each execute is its own implicit txn);
    Connection.commit()/rollback() are best-effort no-ops because
    sqlite-style explicit txns would need Hrana batons across requests.
"""
from __future__ import annotations

import base64
import http.client
import json
import logging
import re
import threading
import urllib.parse
import urllib.request
from typing import Any, Iterable, Optional, Sequence

log = logging.getLogger("turso_http")

# DBAPI 2.0 module-level constants — SQLAlchemy reads these off the module
# returned by the dialect's dbapi() classmethod.
apilevel = "2.0"
threadsafety = 2  # threads can share the module and the connection
paramstyle = "qmark"


# --- Exception hierarchy (mirrors PEP-249) ------------------------------

class Warning(Exception):  # noqa: A001
    pass


class Error(Exception):
    pass


class InterfaceError(Error):
    pass


class DatabaseError(Error):
    pass


class DataError(DatabaseError):
    pass


class OperationalError(DatabaseError):
    pass


class IntegrityError(DatabaseError):
    pass


class InternalError(DatabaseError):
    pass


class ProgrammingError(DatabaseError):
    pass


class NotSupportedError(DatabaseError):
    pass


# stdlib sqlite3 module-level types/constants the dialect probes for.
sqlite_version = "3.45.0"
sqlite_version_info = (3, 45, 0)
version = "0.1.0-turso-http"
version_info = (0, 1, 0)
PARSE_DECLTYPES = 1
PARSE_COLNAMES = 2


def Binary(b: bytes) -> bytes:  # noqa: N802
    return bytes(b)


def register_adapter(*_args, **_kwargs) -> None:
    """No-op: we do our own type adaptation in _to_turso_value."""
    return None


def register_converter(*_args, **_kwargs) -> None:
    """No-op."""
    return None


# --- URL parsing --------------------------------------------------------

def parse_libsql_url(raw: str) -> tuple[str, str]:
    """libsql://host?authToken=jwt → ("host", "jwt")."""
    parsed = urllib.parse.urlparse(raw)
    qs = urllib.parse.parse_qs(parsed.query)
    token = (qs.get("authToken") or [""])[0]
    return parsed.netloc, token


# --- Value marshalling --------------------------------------------------

def _to_turso_value(v: Any) -> dict:
    if v is None:
        return {"type": "null"}
    if isinstance(v, bool):
        return {"type": "integer", "value": str(int(v))}
    if isinstance(v, int):
        return {"type": "integer", "value": str(v)}
    if isinstance(v, float):
        return {"type": "float", "value": v}
    if isinstance(v, (bytes, bytearray, memoryview)):
        return {"type": "blob", "base64": base64.b64encode(bytes(v)).decode("ascii")}
    if isinstance(v, str):
        return {"type": "text", "value": v}
    # datetime / date / Decimal / anything else → ISO/str form
    return {"type": "text", "value": str(v)}


def _from_turso_value(v: dict) -> Any:
    t = v.get("type")
    if t == "null":
        return None
    if t == "integer":
        return int(v["value"])
    if t == "float":
        val = v["value"]
        return float(val) if not isinstance(val, float) else val
    if t == "text":
        return v["value"]
    if t == "blob":
        return base64.b64decode(v["base64"])
    return v.get("value")


# --- Error mapping ------------------------------------------------------

_INTEGRITY_HINTS = ("UNIQUE", "CONSTRAINT", "FOREIGN KEY", "NOT NULL", "CHECK")


def _map_error(err: dict) -> Exception:
    code = err.get("code") or ""
    msg = err.get("message") or ""
    upper = msg.upper()
    if "SQLITE_CONSTRAINT" in code or any(h in upper for h in _INTEGRITY_HINTS):
        return IntegrityError(f"{code}: {msg}")
    if "SQL_PARSE_ERROR" in code or "SQL_INPUT_ERROR" in code:
        return ProgrammingError(f"{code}: {msg}")
    return OperationalError(f"{code}: {msg}")


# --- HTTP transport -----------------------------------------------------

class _HTTPTransport:
    """Thread-safe POSTer to /v2/pipeline. One per (host, token).

    Uses a persistent HTTPS connection with HTTP/1.1 keepalive so repeated
    requests during create_all / batch INSERT don't pay the TCP+TLS
    handshake cost each time (~30-80 ms saved per call). The shim opens
    one connection per Connection object; the connection auto-reopens on
    transport errors.

    Concurrency: the per-connection lock serialises requests through the
    single underlying HTTPSConnection — http.client is not thread-safe.
    For our use case SQLAlchemy serialises queries through one DBAPI
    connection anyway, so this matches the natural shape.
    """

    def __init__(self, host: str, token: str, *, timeout: float = 30.0):
        self._host = host
        self._path = "/v2/pipeline"
        self._auth = f"Bearer {token}" if token else ""
        self._timeout = timeout
        self._lock = threading.Lock()
        self._conn: Optional[http.client.HTTPSConnection] = None

    def _open(self) -> http.client.HTTPSConnection:
        if self._conn is None:
            self._conn = http.client.HTTPSConnection(self._host, timeout=self._timeout)
        return self._conn

    def _close(self) -> None:
        if self._conn is not None:
            try:
                self._conn.close()
            except Exception:  # noqa: BLE001
                pass
            self._conn = None

    def post(self, requests: list[dict]) -> dict:
        body = json.dumps({"requests": requests}).encode("utf-8")
        headers = {"Content-Type": "application/json", "Connection": "keep-alive"}
        if self._auth:
            headers["Authorization"] = self._auth

        with self._lock:
            # One retry on transport hiccup (server closed idle keepalive socket).
            for attempt in (0, 1):
                try:
                    conn = self._open()
                    conn.request("POST", self._path, body=body, headers=headers)
                    resp = conn.getresponse()
                    raw = resp.read()
                    if resp.status >= 500:
                        # Drop the connection on server errors; next call reopens.
                        self._close()
                    break
                except (http.client.HTTPException, ConnectionError, OSError) as e:
                    self._close()
                    if attempt == 1:
                        raise OperationalError(f"Turso HTTP transport error: {e}")
                    continue

        if resp.status != 200:
            raise OperationalError(f"Turso HTTP {resp.status}: {raw[:300]!r}")
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            raise OperationalError(f"non-JSON response from Turso: {e}; body={raw[:200]!r}")

    def close(self) -> None:
        with self._lock:
            self._close()


# --- Statement splitter (for executescript) -----------------------------

# Very small splitter — enough for DDL scripts. Strips comments + splits on
# semicolons not inside strings. Good enough for SQLAlchemy DDL output.
_COMMENT_RE = re.compile(r"--[^\n]*")


def _split_script(script: str) -> list[str]:
    cleaned = _COMMENT_RE.sub("", script)
    out: list[str] = []
    buf: list[str] = []
    in_string: Optional[str] = None
    i = 0
    while i < len(cleaned):
        ch = cleaned[i]
        if in_string:
            buf.append(ch)
            if ch == in_string:
                # check for escaped quote ('' inside string)
                if i + 1 < len(cleaned) and cleaned[i + 1] == in_string:
                    buf.append(cleaned[i + 1])
                    i += 2
                    continue
                in_string = None
        elif ch in ("'", '"'):
            in_string = ch
            buf.append(ch)
        elif ch == ";":
            stmt = "".join(buf).strip()
            if stmt:
                out.append(stmt)
            buf = []
        else:
            buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        out.append(tail)
    return out


# --- Connection / Cursor -----------------------------------------------

class Connection:
    """PEP-249 Connection talking to Turso over HTTPS.

    Autocommit semantics: SQLAlchemy's sqlite dialect (under SQLAlchemy 2.x
    with future=True) issues BEGIN explicitly before transactions and
    COMMIT/ROLLBACK to close them. We accept BEGIN/COMMIT/ROLLBACK as
    plain SQL (Turso ignores BEGIN at the Hrana level and treats each
    request as a unit), so behaviour matches sqlite3 well enough that the
    dialect doesn't complain. Where SQLAlchemy expects strict transactions,
    individual statement durability is what users actually care about and
    that's preserved.
    """

    Error = Error
    InterfaceError = InterfaceError
    DatabaseError = DatabaseError
    DataError = DataError
    OperationalError = OperationalError
    IntegrityError = IntegrityError
    InternalError = InternalError
    ProgrammingError = ProgrammingError
    NotSupportedError = NotSupportedError

    def __init__(self, host: str, token: str, *, timeout: float = 30.0):
        self._transport = _HTTPTransport(host, token, timeout=timeout)
        self._closed = False
        # SQLAlchemy reads/writes these as plain attributes:
        self.isolation_level: Optional[str] = None
        self.row_factory = None
        self.text_factory = str
        self.in_transaction = False
        # Diagnostics:
        self.host = host

    # ---- DBAPI surface ----------------------------------------------

    def cursor(self) -> "Cursor":
        if self._closed:
            raise InterfaceError("connection is closed")
        return Cursor(self)

    def execute(self, sql: str, parameters: Sequence[Any] = ()) -> "Cursor":
        cur = self.cursor()
        cur.execute(sql, parameters)
        return cur

    def executemany(self, sql: str, seq_of_parameters: Iterable[Sequence[Any]]) -> "Cursor":
        cur = self.cursor()
        cur.executemany(sql, seq_of_parameters)
        return cur

    def executescript(self, script: str) -> "Cursor":
        cur = self.cursor()
        for stmt in _split_script(script):
            cur.execute(stmt, ())
        return cur

    def commit(self) -> None:
        # Each execute is already durable on Turso; nothing to flush.
        # The dialect issues "COMMIT" as plain SQL — Turso parses it as the
        # end of an implicit transaction (no-op for our purposes).
        return None

    def rollback(self) -> None:
        # Best-effort: with autocommit semantics there is nothing to roll back.
        # SQLAlchemy uses rollback to abandon a unit of work — for single
        # statements that's already too late. Multi-statement atomicity is
        # NOT guaranteed by this shim; document it in the module docstring.
        return None

    def close(self) -> None:
        try:
            self._transport.close()
        except Exception:  # noqa: BLE001
            pass
        self._closed = True

    @property
    def closed(self) -> bool:
        return self._closed

    # ---- sqlite3.Connection compatibility shims --------------------
    # SQLAlchemy's pysqlite dialect installs UDFs (REGEXP, etc.) and may
    # call these during on_connect. We accept the calls and do nothing —
    # Turso runs server-side and does not execute Python callbacks.

    def create_function(self, name, narg, func, **kwargs) -> None:  # noqa: ARG002
        return None

    def create_aggregate(self, name, n_arg, aggregate_class) -> None:  # noqa: ARG002
        return None

    def create_collation(self, name, callable_) -> None:  # noqa: ARG002
        return None

    def set_authorizer(self, authorizer_callback) -> None:  # noqa: ARG002
        return None

    def set_progress_handler(self, handler, n) -> None:  # noqa: ARG002
        return None

    def set_trace_callback(self, trace_callback) -> None:  # noqa: ARG002
        return None

    def interrupt(self) -> None:
        return None

    # Context manager support (sqlite3.Connection supports __enter__/__exit__).
    def __enter__(self) -> "Connection":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type is None:
            self.commit()
        else:
            self.rollback()

    # ---- helpers used by Cursor -------------------------------------

    def _execute_one(self, sql: str, params: Sequence[Any]) -> dict:
        stmt: dict = {"sql": sql}
        if params:
            stmt["args"] = [_to_turso_value(p) for p in params]
        response = self._transport.post([
            {"type": "execute", "stmt": stmt},
            {"type": "close"},
        ])
        results = response.get("results", [])
        if not results:
            raise OperationalError(f"empty pipeline response: {response!r}")
        first = results[0]
        if first.get("type") == "error":
            raise _map_error(first.get("error") or {})
        return first.get("response", {}).get("result", {})


class Cursor:
    arraysize = 1

    def __init__(self, conn: Connection):
        self._conn = conn
        self._rows: list[tuple] = []
        self._idx = 0
        self._description: Optional[list[tuple]] = None
        self._rowcount: int = -1
        self._lastrowid: Optional[int] = None

    # ---- PEP-249 attributes -----------------------------------------

    @property
    def description(self) -> Optional[list[tuple]]:
        return self._description

    @property
    def rowcount(self) -> int:
        return self._rowcount

    @property
    def lastrowid(self) -> Optional[int]:
        return self._lastrowid

    @property
    def connection(self) -> Connection:
        return self._conn

    # ---- execute / fetch --------------------------------------------

    def execute(self, sql: str, parameters: Sequence[Any] = ()) -> "Cursor":
        result = self._conn._execute_one(sql, parameters or ())
        cols = result.get("cols") or []
        self._description = [
            (c.get("name"), None, None, None, None, None, None)
            for c in cols
        ] or None
        rows = result.get("rows") or []
        self._rows = [
            tuple(_from_turso_value(v) for v in row)
            for row in rows
        ]
        self._idx = 0
        affected = result.get("affected_row_count")
        self._rowcount = int(affected) if affected is not None else -1
        lri = result.get("last_insert_rowid")
        self._lastrowid = int(lri) if lri not in (None, "", 0, "0") else None
        return self

    def executemany(self, sql: str, seq_of_parameters: Iterable[Sequence[Any]]) -> "Cursor":
        last: Optional[dict] = None
        total = 0
        for params in seq_of_parameters:
            self.execute(sql, params or ())
            if self._rowcount and self._rowcount > 0:
                total += self._rowcount
        if total:
            self._rowcount = total
        return self

    def fetchone(self) -> Optional[tuple]:
        if self._idx >= len(self._rows):
            return None
        row = self._rows[self._idx]
        self._idx += 1
        return row

    def fetchmany(self, size: Optional[int] = None) -> list[tuple]:
        if size is None:
            size = self.arraysize
        end = min(self._idx + size, len(self._rows))
        out = self._rows[self._idx:end]
        self._idx = end
        return out

    def fetchall(self) -> list[tuple]:
        out = self._rows[self._idx:]
        self._idx = len(self._rows)
        return out

    def close(self) -> None:
        self._rows = []
        self._idx = 0

    def setinputsizes(self, sizes) -> None:  # noqa: ARG002
        return None

    def setoutputsize(self, size, column=None) -> None:  # noqa: ARG002
        return None

    def __iter__(self) -> "Cursor":
        return self

    def __next__(self) -> tuple:
        row = self.fetchone()
        if row is None:
            raise StopIteration
        return row


# --- Module-level connect() (PEP-249) ----------------------------------

def connect(database: str = "", *, host: str = "", token: str = "", timeout: float = 30.0, **_kwargs) -> Connection:
    """Open a connection. Either `database` is a libsql:// URL, or pass host+token."""
    if database and database.startswith("libsql://"):
        host, token = parse_libsql_url(database)
    if not host:
        raise InterfaceError("turso_http.connect: no host (provide libsql:// URL or host= kwarg)")
    return Connection(host, token, timeout=timeout)

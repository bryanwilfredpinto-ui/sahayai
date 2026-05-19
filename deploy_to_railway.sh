#!/usr/bin/env bash
# deploy_to_railway.sh
# --------------------
# Sahayai → Railway: one-command deploy for every Chitti service.
#
# Usage:
#   ./deploy_to_railway.sh                 # deploy ALL services in railway-env/
#   ./deploy_to_railway.sh chitti-medupi   # deploy a single service
#   ./deploy_to_railway.sh chitti-medupi chitti-legal chitti-ca
#
# What it does, per service (idempotent — safe to re-run):
#   1. Links the current repo to Railway project "elegant-radiance".
#   2. Creates an empty service `<chitti>-api` if it doesn't exist.
#   3. Reads railway-env/<chitti>.env (KEY=VALUE pairs, # comments OK)
#      and uploads every variable to that service via `railway variables`.
#   4. Triggers a deploy from <chitti>/backend/ via `railway up --detach`.
#
# Pre-flight (one time per machine):
#   npm install -g @railway/cli
#   railway login                       # OR: export RAILWAY_TOKEN=<pat>
#
# Per SAHAYAI_MASTER.md §2: secrets in railway-env/*.env are gitignored
# (commit 062c3cd). This script READS them locally to push to Railway,
# never logs them.
#
# Region note: Railway does not offer ap-south-1. Set each service to
# asia-southeast1 (Singapore) in the dashboard after first deploy —
# CLI doesn't expose region selection. railway.toml documents this.

set -eu

PROJECT_NAME="elegant-radiance"
ENV_DIR="railway-env"

# ---------- helpers ---------------------------------------------------------

log()  { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
die()  { log "FATAL: $*"; exit 1; }

ensure_cli() {
  command -v railway >/dev/null 2>&1 \
    || die "railway CLI not found. Run: npm install -g @railway/cli"
}

ensure_logged_in() {
  # `railway whoami` exits 1 when not logged in. Print friendly hint.
  if ! railway whoami >/dev/null 2>&1; then
    cat >&2 <<'EOF'
Railway CLI is not authenticated.

Pick ONE of these:
  (a) Interactive:   railway login
      (opens a browser tab)

  (b) Headless CI:   export RAILWAY_TOKEN=<personal-access-token>
      Generate the token at https://railway.app/account/tokens

Re-run this script after authenticating.
EOF
    exit 1
  fi
}

ensure_project_linked() {
  # Idempotent — `railway link` is no-op if already linked to the same project.
  log "Linking workspace to project '$PROJECT_NAME'..."
  railway link --project "$PROJECT_NAME" >/dev/null 2>&1 \
    || die "could not link to project '$PROJECT_NAME' — does it exist? Run 'railway list'."
  log "  linked."
}

# List all current service names in the linked project, one per line.
list_services() {
  # v4 CLI: `railway service list --json` returns a flat array of objects,
  # each with a top-level `.name`. (`railway status --json` returns a
  # different shape and does NOT carry service names at the top level.)
  if command -v jq >/dev/null 2>&1; then
    railway service list --json 2>/dev/null \
      | jq -r '.[]?.name // empty'
  else
    # Best-effort fallback: parse `railway status` plaintext.
    railway status 2>/dev/null \
      | awk '/^[[:space:]]*-[[:space:]]/ {sub(/^[[:space:]]*-[[:space:]]/,""); sub(/:.*$/,""); print}'
  fi
}

ensure_service_exists() {
  local svc="$1"
  if list_services | grep -Fxq "$svc"; then
    log "  service '$svc' already exists — reusing."
    return 0
  fi
  log "  creating service '$svc' ..."
  # v4 CLI: `railway add --service <name>` is the non-interactive create.
  # There is no `railway service create` subcommand in v4.59.
  if ! railway add --service "$svc" >/dev/null 2>&1; then
    die "service create failed for '$svc'. Try: railway add --service $svc"
  fi
  log "    created."
}

upload_vars() {
  local svc="$1"
  local envfile="$2"
  [ -f "$envfile" ] || die "missing env file: $envfile"

  log "  uploading vars from $envfile to $svc ..."

  # Build a --set arg per non-comment, non-blank line. The .env files in
  # railway-env/ are KEY=VALUE (no surrounding quotes, no shell-export).
  # Empty-value lines (KEY=) are skipped — Railway CLI rejects them with
  # "Invalid variable format". An intentional empty string should be
  # quoted (KEY="") in the .env file, which we honor here.
  local set_args=()
  local skipped=0
  while IFS= read -r line; do
    # strip CR (Windows line endings) + trim leading whitespace
    line="${line%$'\r'}"
    line="${line#"${line%%[![:space:]]*}"}"
    case "$line" in
      ''|'#'*) continue ;;
    esac
    # Must contain '=' to be a KEY=VALUE pair.
    case "$line" in
      *'='*) : ;;
      *)     continue ;;
    esac
    # Reject KEY= (empty RHS) — Railway CLI errors out on these.
    local rhs="${line#*=}"
    if [ -z "$rhs" ]; then
      skipped=$((skipped + 1))
      log "    skipped empty-value: ${line%%=*}"
      continue
    fi
    set_args+=( --set "$line" )
  done < "$envfile"

  if [ "${#set_args[@]}" -eq 0 ]; then
    log "    no variables found, skipping."
    return 0
  fi

  # --skip-deploys: bulk-apply WITHOUT triggering N deploys. We deploy
  # explicitly in the next step.
  #
  # MSYS_NO_PATHCONV + MSYS2_ARG_CONV_EXCL=* disable Git Bash's POSIX→Windows
  # path translation when passing the values to railway.exe. Without this,
  # any value starting with / (e.g. `/tmp/chitti.db`, `/health`) gets
  # silently rewritten to `C:/Users/DELL/AppData/Local/Temp/chitti.db`
  # before reaching Railway — which then crashes the Linux container with
  # "Unable to open connection to local database C:/Users/DELL/…".
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' railway variables \
    --service "$svc" \
    --skip-deploys \
    "${set_args[@]}" >/dev/null
  log "    uploaded $(( ${#set_args[@]} / 2 )) variables."
}

deploy_service() {
  local svc="$1"
  local root="$2"
  [ -d "$root" ] || die "missing backend directory: $root"

  # CRITICAL: `railway up` walks UP from cwd to find .git and uploads the
  # whole repo from there. That makes Railpack detect repo-root entrypoints
  # (server.js / Procfile / index.html) instead of the per-Chitti backend's
  # main.py + Procfile. Workaround: stage just the backend in a temp dir
  # outside any git tree and upload from there with --project. The snapshot
  # then contains ONLY this backend's files, so Railpack auto-detects the
  # correct language + start command.
  log "  staging $root into a clean temp dir ..."
  local tmp
  tmp="$(mktemp -d -t "railway-${svc}-XXXXXX")"
  cp -a "$root"/. "$tmp/"

  log "  deploying $svc from $tmp ..."
  (
    cd "$tmp" \
      && railway link --project "$PROJECT_NAME" --environment production --service "$svc" >/dev/null 2>&1 \
      && railway up --service "$svc" --detach >/dev/null
  )
  rm -rf "$tmp"
  log "    deploy triggered (snapshot scoped to $root only)."
}

# ---------- per-service driver ---------------------------------------------

deploy_one() {
  local chitti="$1"                  # e.g. chitti-medupi
  local svc="${chitti}-api"          # e.g. chitti-medupi-api
  local envfile="$ENV_DIR/${chitti}.env"
  local root="${chitti}/backend"

  log "── ${chitti} ──"
  [ -f "$envfile" ] || die "missing $envfile — add it to railway-env/ first."

  ensure_service_exists "$svc"
  upload_vars           "$svc" "$envfile"
  deploy_service        "$svc" "$root"
  log "  ${chitti} ✓"
}

# ---------- main -----------------------------------------------------------

main() {
  ensure_cli
  ensure_logged_in
  ensure_project_linked

  # Determine the worklist.
  local targets=()
  if [ "$#" -gt 0 ]; then
    targets=( "$@" )
  else
    # Default: every .env file in railway-env/.
    for f in "$ENV_DIR"/chitti-*.env; do
      [ -f "$f" ] || die "no .env files found under $ENV_DIR/"
      local base
      base="$(basename "$f" .env)"
      targets+=( "$base" )
    done
  fi

  log "Deploying ${#targets[@]} service(s) to project $PROJECT_NAME:"
  for t in "${targets[@]}"; do log "  - $t"; done

  for t in "${targets[@]}"; do
    deploy_one "$t"
  done

  log "Done. After first deploy of each service:"
  log "  • Set region to asia-southeast1 in the Railway dashboard"
  log "    (closest to ap-south-1; CLI doesn't expose region)."
  log "  • Verify /health returns 200 within 60 s."
}

main "$@"

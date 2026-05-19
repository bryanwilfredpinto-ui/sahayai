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
  # `railway status --json` returns { "services": [ { "name": "..." } ... ] }
  # Fall back to text parse if jq is missing.
  if command -v jq >/dev/null 2>&1; then
    railway status --json 2>/dev/null \
      | jq -r '.services[]?.name // empty'
  else
    # Best-effort parse of plaintext status output.
    railway status 2>/dev/null \
      | awk -F': *' '/^[Ss]ervices?/{flag=1;next} flag && /^  /{print $1}' \
      | tr -d ' '
  fi
}

ensure_service_exists() {
  local svc="$1"
  if list_services | grep -Fxq "$svc"; then
    log "  service '$svc' already exists — reusing."
  else
    log "  creating service '$svc' ..."
    # CLI evolution: try v3 first, fall back to older syntax.
    if railway service create "$svc" >/dev/null 2>&1; then
      :
    elif railway add --service "$svc" >/dev/null 2>&1; then
      :
    else
      # Last resort: `railway add` interactive — not autonomous, so die.
      die "service create failed for '$svc'. CLI version may not support non-interactive create. Run: railway add --service $svc"
    fi
    log "    created."
  fi
}

upload_vars() {
  local svc="$1"
  local envfile="$2"
  [ -f "$envfile" ] || die "missing env file: $envfile"

  log "  uploading vars from $envfile to $svc ..."

  # Build a --set arg per non-comment, non-blank line. The .env files in
  # railway-env/ are KEY=VALUE (no surrounding quotes, no shell-export).
  local set_args=()
  while IFS= read -r line; do
    # strip CR (Windows line endings) + trim leading whitespace
    line="${line%$'\r'}"
    line="${line#"${line%%[![:space:]]*}"}"
    case "$line" in
      ''|'#'*) continue ;;
    esac
    # Must contain '=' to be a KEY=VALUE pair.
    case "$line" in
      *'='*) set_args+=( --set "$line" ) ;;
      *)     continue ;;
    esac
  done < "$envfile"

  if [ "${#set_args[@]}" -eq 0 ]; then
    log "    no variables found, skipping."
    return 0
  fi

  # --skip-deploys: bulk-apply WITHOUT triggering N deploys. We deploy
  # explicitly in the next step.
  railway variables \
    --service "$svc" \
    --skip-deploys \
    "${set_args[@]}" >/dev/null
  log "    uploaded $(( ${#set_args[@]} / 2 )) variables."
}

deploy_service() {
  local svc="$1"
  local root="$2"
  [ -d "$root" ] || die "missing backend directory: $root"

  log "  deploying $svc from $root ..."
  ( cd "$root" && railway up --service "$svc" --detach >/dev/null )
  log "    deploy triggered (check Railway dashboard for build progress)."
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

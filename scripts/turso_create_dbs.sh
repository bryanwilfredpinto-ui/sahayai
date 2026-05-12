#!/bin/bash
# Create the 7 Turso DBs for Chitti products in Mumbai (aws-ap-south-1).
# Run inside WSL Ubuntu where the turso CLI is installed.
set -e
TURSO=/home/bryan/.turso/turso
DBS=(chitti-news chitti-government chitti-vaani chitti-ca chitti-legal chitti-voice-factory chitti-shares)

echo "Existing DBs before:"
$TURSO db list

for db in "${DBS[@]}"; do
  if $TURSO db list | awk 'NR>1{print $1}' | grep -qx "$db"; then
    echo "=== $db: already exists, skipping ==="
  else
    echo "=== creating $db (bom) ==="
    $TURSO db create "$db" --location bom
  fi
done

echo
echo "===== final list ====="
$TURSO db list

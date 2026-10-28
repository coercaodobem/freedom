#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
RESOURCE_DIR="$ROOT/benchmark/src/androidTest/resources"
PARTS_DIR="$RESOURCE_DIR/nostr_vitor_startup_data.json.gz.parts"
OUTPUT="$RESOURCE_DIR/nostr_vitor_startup_data.json.gz"
TEMP_OUTPUT="$OUTPUT.tmp.$$"
EXPECTED_SHA256="dbb75932a07ceef18d4904c4e9e2010dd2c62bafdd394b44285a5f5258c96ba8"

trap 'rm -f "$TEMP_OUTPUT"' EXIT
shopt -s nullglob
PARTS=("$PARTS_DIR"/part-[0-9][0-9][0-9])
if [[ ${#PARTS[@]} -ne 73 ]]; then
    printf 'Esperava 73 partes em %s; encontrei %s.\n' "$PARTS_DIR" "${#PARTS[@]}" >&2
    exit 1
fi

cat "${PARTS[@]}" > "$TEMP_OUTPUT"
if ! printf '%s  %s\n' "$EXPECTED_SHA256" "$TEMP_OUTPUT" | sha256sum --check --status; then
    echo "O corpus recomposto falhou na verificação SHA-256." >&2
    exit 1
fi

mv -- "$TEMP_OUTPUT" "$OUTPUT"
trap - EXIT
printf 'Corpus restaurado e verificado: %s\n' "$OUTPUT"

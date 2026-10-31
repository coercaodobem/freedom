#!/usr/bin/env bash
set -euo pipefail
umask 077
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$(uname -s)" != Darwin || "$(uname -m)" != arm64 ]]; then
  printf 'Este pacote requer macOS Apple Silicon (arm64). Use a PWA em outras plataformas.\n' >&2
  exit 2
fi
DATA_DIR="${PROPERTY_RELAY_DATA_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/property-relay}"
CONFIG_DIR="${PROPERTY_RELAY_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/property-relay}"
HOST="${PROPERTY_RELAY_HOST:-127.0.0.1}"
PORT="${PROPERTY_RELAY_PORT:-7447}"
CONFIG="${PROPERTY_RELAY_CONFIG:-$CONFIG_DIR/geode.toml}"
case "$PORT" in ''|*[!0-9]*) printf 'Porta inválida.\n' >&2; exit 2;; esac
if (( PORT < 1 || PORT > 65535 )); then printf 'Porta inválida.\n' >&2; exit 2; fi
case "$HOST" in ''|*[!a-zA-Z0-9.:-]*) printf 'Host inválido.\n' >&2; exit 2;; esac
PARTS="$SCRIPT_DIR/portable/macos-arm64"
EXPECTED_SHA256="141b50c327439f60f9c6d71b1a3323e961836bcdfcf7f52b45b2000c57d50aa2"
PART_COUNT="85"
mkdir -p "$DATA_DIR/runtime" "$CONFIG_DIR"
ARCHIVE="$DATA_DIR/runtime/property-macos-arm64.zip"
if [[ ! -f "$ARCHIVE" ]]; then
  TEMP="$ARCHIVE.tmp.$$"
  trap 'rm -f -- "$TEMP"' EXIT
  : > "$TEMP"
  for ((INDEX=0; INDEX<PART_COUNT; INDEX++)); do
    PART=$(printf '%03d' "$INDEX")
    cat "$PARTS/part-$PART" >> "$TEMP"
  done
  printf '%s  %s\n' "$EXPECTED_SHA256" "$TEMP" | shasum -a 256 --check --status
  mv "$TEMP" "$ARCHIVE"
fi
printf '%s  %s\n' "$EXPECTED_SHA256" "$ARCHIVE" | shasum -a 256 --check --status
JAVA="$DATA_DIR/runtime/geode/runtime/bin/java"
if [[ ! -x "$JAVA" ]]; then unzip -q -o "$ARCHIVE" -d "$DATA_DIR/runtime"; fi
DB_FILE="$DATA_DIR/events.db"
DB_ESCAPED=${DB_FILE//\\/\\\\}
DB_ESCAPED=${DB_ESCAPED//\"/\\\"}
if [[ ! -f "$CONFIG" ]]; then
  cat > "$CONFIG" <<TOML
[info]
name = "Property Geode Relay"
description = "Relay Nostr pessoal Property"
[network]
host = "$HOST"
port = $PORT
path = "/"
[database]
in_memory = false
file = "$DB_ESCAPED"
[options]
verify_signatures = true
require_auth = false
TOML
fi
printf 'Iniciando Property em %s:%s\nDados: %s\n' "$HOST" "$PORT" "$DATA_DIR"
exec "$JAVA" -cp "$DATA_DIR/runtime/geode/lib/*" com.vitorpamplona.geode.MainKt --config "$CONFIG" --host "$HOST" --port "$PORT"

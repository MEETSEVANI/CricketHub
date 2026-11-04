#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <target-url> [report-prefix]" >&2
  exit 2
fi

target_url="$1"
report_prefix="${2:-baseline}"
if [[ ! "$target_url" =~ ^https?:// ]]; then
  echo "Target URL must start with http:// or https://" >&2
  exit 2
fi
if [[ ! "$report_prefix" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Report prefix may contain only letters, numbers, dots, underscores, and hyphens." >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
report_dir="$repo_root/security/reports"
mkdir -p "$report_dir"

docker run --rm --tty \
  --volume "$report_dir:/zap/wrk/:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t "$target_url" \
  -r "$report_prefix.html" \
  -J "$report_prefix.json" \
  -I

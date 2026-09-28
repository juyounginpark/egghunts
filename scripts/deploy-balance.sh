#!/usr/bin/env bash
set -euo pipefail
# Run on the existing host after uploading the reviewed bundle to /tmp.
test -s /tmp/egghunts-balance-host.mjs
backup="/opt/egghunts/backups/balance-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup"
cp /opt/egghunts/host.mjs "$backup/host.mjs"
systemctl stop egghunts
trap 'systemctl start egghunts' EXIT
tar -czf "$backup/data.tar.gz" -C /var/lib egghunts
cp /tmp/egghunts-balance-host.mjs /opt/egghunts/host.mjs
systemctl start egghunts
systemctl is-active egghunts
printf '%s\n' "$backup"

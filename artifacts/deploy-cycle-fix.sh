#!/bin/bash
set -eu
backup=/opt/egghunts/backups/cycle-fix-$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$backup"
cp /opt/egghunts/host.mjs "$backup/host.mjs"
systemctl stop egghunts
rollback() {
  cp "$backup/host.mjs" /opt/egghunts/host.mjs
  systemctl start egghunts
}
trap rollback ERR
tar -czf "$backup/data.tar.gz" -C /var/lib egghunts
cp /tmp/egghunts-cycle-fix-host.mjs /opt/egghunts/host.mjs
systemctl start egghunts
systemctl is-active egghunts
trap - ERR
echo "$backup"

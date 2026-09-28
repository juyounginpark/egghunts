#!/bin/bash
set -eu
# Run as root after uploading the release bundle; preserve every saved player.
release=/tmp/egghunts-night-weather-host.mjs
test -s "$release"
backup=/opt/egghunts/backups/night-weather-$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$backup"
cp /opt/egghunts/host.mjs "$backup/host.mjs"
systemctl stop egghunts
trap 'systemctl start egghunts' EXIT
tar -czf "$backup/data.tar.gz" -C /var/lib egghunts
cp "$release" /opt/egghunts/host.mjs
if ! systemctl start egghunts; then
 cp "$backup/host.mjs" /opt/egghunts/host.mjs
 systemctl start egghunts
 exit 1
fi
systemctl is-active egghunts
echo "$backup"

#!/bin/bash
set -euo pipefail
release="$(cd "$(dirname "$0")" && pwd)"
backup="/opt/egghunts/backups/local-first-$(date -u +%Y%m%dT%H%M%SZ)"
sudo install -d -m 700 "$backup"
sudo cp /opt/egghunts/host.mjs /etc/egghunts.env /etc/systemd/system/egghunts.service /etc/nginx/conf.d/egghunts.conf "$backup/"
rollback() {
 sudo cp "$backup/host.mjs" /opt/egghunts/host.mjs
 sudo cp "$backup/egghunts.env" /etc/egghunts.env
 sudo cp "$backup/egghunts.service" /etc/systemd/system/egghunts.service
 sudo cp "$backup/egghunts.conf" /etc/nginx/conf.d/egghunts.conf
 sudo systemctl daemon-reload
 sudo systemctl restart egghunts
 sudo nginx -t && sudo systemctl reload nginx
}
trap rollback ERR
sudo systemctl stop egghunts
sudo node --env-file=/etc/egghunts.env "$release/migrate-local-profiles.mjs" "$backup"
sudo python3 - "$release" <<'PY'
from pathlib import Path
import sys
release=Path(sys.argv[1])
old={line.split('=',1)[0]:line.split('=',1)[1] for line in Path('/etc/egghunts.env').read_text().splitlines() if '=' in line}
keep={key:old[key] for key in ['SUPABASE_URL','GAME_ALLOWED_ORIGINS']}
keep.update(SUPABASE_PUBLISHABLE_KEY='sb_publishable_2KTon_WzPAci5G4dLyZ5Ww_bPgwmiig',HOST='127.0.0.1',PORT='4330',PRESENCE_MAX_ROOMS='60',PRESENCE_TRANSFER_PATH='/var/lib/egghunts/presence-transfer.json',GAME_MONTHLY_PAYLOAD_MB=old.get('GAME_MONTHLY_PAYLOAD_MB','10240'))
Path('/etc/egghunts.env').write_text(''.join(key+'='+value+'\n' for key,value in keep.items()))
nginx=Path('/etc/nginx/conf.d/egghunts.conf')
content=nginx.read_text().replace('location = /game {','location = /presence {')
nginx.write_text(content)
PY
sudo chmod 600 /etc/egghunts.env
sudo chown egghunts:egghunts /var/lib/egghunts/presence-transfer.json
sudo install -m 644 "$release/host.mjs" /opt/egghunts/host.mjs
sudo install -m 644 "$release/egghunts.service" /etc/systemd/system/egghunts.service
sudo systemctl daemon-reload
sudo nginx -t
sudo systemctl restart egghunts
for attempt in {1..15}; do
 if curl -fsS http://127.0.0.1:4330/readyz; then break; fi
 sleep 1
done
curl -fsS http://127.0.0.1:4330/readyz | grep -q 'egghunts-friends'
sudo systemctl reload nginx
trap - ERR
echo "Deployment backup: $backup"

#!/bin/bash
set -euo pipefail
# Run from the uploaded release directory. Never replaces /var/lib/egghunts.
id egghunts >/dev/null 2>&1 || sudo useradd --system --home-dir /var/lib/egghunts --shell /sbin/nologin egghunts
sudo install -d -m 755 /opt/egghunts
sudo install -m 644 host.mjs /opt/egghunts/host.mjs
sudo install -m 600 .env.production /etc/egghunts.env
sudo install -m 644 egghunts.service /etc/systemd/system/egghunts.service
sudo install -m 644 nginx-game.conf /etc/nginx/conf.d/egghunts.conf
sudo systemctl daemon-reload
sudo systemctl enable --now egghunts
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

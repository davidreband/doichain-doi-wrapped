#!/bin/bash
# Quick server analysis - run this on the server

echo "=== SYSTEM INFO ==="
uname -a
echo ""

echo "=== OS VERSION ==="
cat /etc/os-release
echo ""

echo "=== RESOURCES ==="
echo "Memory:" && free -h
echo "Disk:" && df -h
echo "CPU cores: $(nproc)"
echo ""

echo "=== INSTALLED SOFTWARE ==="
echo "Node.js: $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "npm: $(npm --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "NGINX: $(nginx -v 2>&1 || echo 'NOT INSTALLED')"
echo "Git: $(git --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "PM2: $(pm2 --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "Certbot: $(certbot --version 2>/dev/null || echo 'NOT INSTALLED')"
echo ""

echo "=== NETWORK ==="
echo "Public IP: $(curl -s ifconfig.me || echo 'Unable to detect')"
echo "Open ports:"
ss -tulpn | grep LISTEN
echo ""

echo "=== SERVICES STATUS ==="
systemctl is-active nginx && echo "NGINX: Running" || echo "NGINX: Stopped"
systemctl is-active ssh && echo "SSH: Running" || echo "SSH: Stopped"
echo ""

echo "=== ANALYSIS COMPLETE ==="
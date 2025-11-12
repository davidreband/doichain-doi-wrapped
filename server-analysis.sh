#!/bin/bash

# Server Analysis Script for Production Deployment
# Run this script on the target server: rebanda@45.83.141.11

echo "🔍 Analyzing server for Wrapped DOI Chain deployment..."
echo "=================================================="

# System Information
echo "📋 SYSTEM INFORMATION:"
echo "----------------------"
echo "Hostname: $(hostname)"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Uptime: $(uptime -p)"
echo ""

# Hardware Resources
echo "💾 HARDWARE RESOURCES:"
echo "----------------------"
echo "CPU Cores: $(nproc)"
echo "CPU Info: $(cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2 | xargs)"
echo ""
echo "Memory:"
free -h
echo ""
echo "Disk Space:"
df -h
echo ""

# Network Information
echo "🌐 NETWORK INFORMATION:"
echo "----------------------"
echo "Public IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to detect')"
echo "Private IP: $(hostname -I | awk '{print $1}')"
echo ""
echo "Open Ports:"
ss -tulpn | grep LISTEN | head -10
echo ""

# Installed Software
echo "📦 INSTALLED SOFTWARE:"
echo "---------------------"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "PM2: $(pm2 --version 2>/dev/null || echo 'Not installed')"
echo "NGINX: $(nginx -v 2>&1 | cut -d'/' -f2 || echo 'Not installed')"
echo "Git: $(git --version 2>/dev/null || echo 'Not installed')"
echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
echo "Certbot: $(certbot --version 2>/dev/null || echo 'Not installed')"
echo ""

# Running Services
echo "🔄 RUNNING SERVICES:"
echo "-------------------"
systemctl is-active nginx 2>/dev/null && echo "✅ NGINX: Running" || echo "❌ NGINX: Not running"
systemctl is-active ssh 2>/dev/null && echo "✅ SSH: Running" || echo "❌ SSH: Not running"
systemctl is-active ufw 2>/dev/null && echo "✅ UFW: Running" || echo "❌ UFW: Not running"
echo ""

# PM2 Status (if installed)
if command -v pm2 &> /dev/null; then
    echo "📊 PM2 STATUS:"
    echo "-------------"
    pm2 list 2>/dev/null || echo "No PM2 processes running"
    echo ""
fi

# Security Status
echo "🛡️ SECURITY STATUS:"
echo "------------------"
echo "UFW Status:"
sudo ufw status 2>/dev/null || echo "UFW not configured"
echo ""

echo "SSH Configuration:"
echo "Port: $(grep "^Port" /etc/ssh/sshd_config 2>/dev/null || echo "22 (default)")"
echo "PermitRootLogin: $(grep "^PermitRootLogin" /etc/ssh/sshd_config 2>/dev/null || echo "Default")"
echo "PasswordAuthentication: $(grep "^PasswordAuthentication" /etc/ssh/sshd_config 2>/dev/null || echo "Default")"
echo ""

# SSL Certificates
echo "🔒 SSL CERTIFICATES:"
echo "-------------------"
if command -v certbot &> /dev/null; then
    sudo certbot certificates 2>/dev/null || echo "No certificates found"
else
    echo "Certbot not installed"
fi
echo ""

# Disk Usage Analysis
echo "📁 DISK USAGE ANALYSIS:"
echo "----------------------"
echo "Root directory usage:"
sudo du -sh /* 2>/dev/null | sort -hr | head -10
echo ""

# Log Files
echo "📝 LOG FILES:"
echo "------------"
echo "System logs size:"
sudo du -sh /var/log 2>/dev/null || echo "Cannot access /var/log"
echo ""
echo "Available log files:"
ls -la /var/log/ 2>/dev/null | head -10 || echo "Cannot access log directory"
echo ""

# Package Updates
echo "📦 PACKAGE STATUS:"
echo "-----------------"
echo "Checking for available updates..."
apt list --upgradable 2>/dev/null | wc -l | xargs echo "Packages available for update:"
echo ""

# Web Directory Status
echo "🌐 WEB DIRECTORY:"
echo "----------------"
if [ -d "/var/www" ]; then
    echo "Contents of /var/www:"
    ls -la /var/www/ 2>/dev/null
else
    echo "/var/www directory does not exist"
fi
echo ""

# Current User Info
echo "👤 CURRENT USER:"
echo "---------------"
echo "User: $(whoami)"
echo "Groups: $(groups)"
echo "Sudo access: $(sudo -l 2>/dev/null | grep -q NOPASSWD && echo "Yes" || echo "Requires password")"
echo ""

# Performance Check
echo "⚡ PERFORMANCE CHECK:"
echo "--------------------"
echo "Load Average:"
uptime
echo ""
echo "Memory Usage:"
free -m | awk 'NR==2{printf "Memory Usage: %s/%sMB (%.2f%%)\n", $3,$2,$3*100/$2 }'
echo ""
echo "Disk I/O:"
iostat -d 1 1 2>/dev/null | tail -n +4 || echo "iostat not available"
echo ""

echo "🎯 ANALYSIS COMPLETE!"
echo "===================="
echo ""
echo "📋 RECOMMENDATIONS:"
echo "------------------"

# Recommendations based on analysis
if ! command -v node &> /dev/null; then
    echo "❗ Install Node.js (required)"
fi

if ! command -v pm2 &> /dev/null; then
    echo "❗ Install PM2 (recommended for process management)"
fi

if ! command -v nginx &> /dev/null; then
    echo "❗ Install NGINX (required for reverse proxy)"
fi

if ! command -v git &> /dev/null; then
    echo "❗ Install Git (required for deployment)"
fi

if ! command -v certbot &> /dev/null; then
    echo "❗ Install Certbot (required for SSL certificates)"
fi

# Check if UFW is configured
if ! sudo ufw status | grep -q "Status: active"; then
    echo "❗ Configure UFW firewall (recommended for security)"
fi

echo ""
echo "🚀 Ready for deployment setup!"
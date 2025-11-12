# Server Setup Log - Wrapped DOI Chain

**Server:** rebanda@45.83.141.11  
**OS:** CentOS Stream 9  
**Project:** Wrapped DOI Chain (wDOI)  
**Start Date:** 2024-11-12

---

## ✅ CURRENT SERVER STATE

### System Information
- **Hostname:** nm7009898-900.avanetco.com
- **OS:** CentOS Stream 9
- **Kernel:** 5.14.0-25.el9.x86_64
- **CPU:** 8 cores
- **RAM:** 7.5GB
- **Disk:** 89GB (85GB available)
- **Uptime:** 97 days (stable server)

### ✅ ALREADY INSTALLED SOFTWARE

| Software | Version | Status | Notes |
|----------|---------|---------|-------|
| Node.js | v20.19.2 | ✅ Installed | LTS version, compatible |
| npm | 10.8.2 | ✅ Installed | Current version |
| NGINX | 1.20.1 | ✅ Installed | Need to configure |
| Git | 2.47.3 | ✅ Installed | Current version |
| Certbot | 3.1.0 | ✅ Installed | For SSL certificates |
| SSH | Active | ✅ Running | Key-based access configured |

---

## 📋 INSTALLATION PLAN

### Stage 1: Install Missing Software
- [x] PM2 (Process Manager) - v6.0.13
- [x] Configure PM2 startup  
- [x] Create project directories

### Stage 2: Environment Setup
- [x] Create working directories (/home/rebanda/wdoi-project)
- [x] Configure permissions (user ownership)
- [x] Create configuration files (ecosystem.config.js, .env.production)

### Stage 3: Web Server Configuration
- [ ] NGINX configuration
- [ ] SSL certificates setup
- [ ] Firewall configuration (UFW)

### Stage 4: Application Deployment
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Build frontend
- [ ] Configure backend API
- [ ] Start with PM2

### Stage 5: Monitoring and Security
- [ ] Configure logging
- [ ] Process monitoring
- [ ] Security audit
- [ ] Configuration backups

---

## 🚀 INSTALLATION LOG

### [2024-11-12 14:30] Installation Start

#### ✅ Preparatory Actions
- [x] SSH key access configured
- [x] Server analysis completed
- [x] Documentation created

#### 📦 PM2 Installation

**Installation commands:**
```bash
# Setup local npm prefix
mkdir -p ~/.local/bin
npm config set prefix ~/.local

# Install PM2 locally
npm install -g pm2

# Add to PATH
echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Version check:**
```bash
pm2 --version
```

**Installation result:**
```
✅ PM2 v6.0.13 installed successfully
✅ Installed in: /home/rebanda/.local/bin/pm2
✅ PATH configured in ~/.bashrc
✅ PM2 daemon started at /home/rebanda/.pm2
```

**Status:** ✅ COMPLETED [2024-11-12 14:50]

---

## 📁 PROJECT STRUCTURE ON SERVER

### Project directories (User installation):
```
/home/rebanda/wdoi-project/       # Main project directory
├── web-app/                      # Frontend (SvelteKit)
│   ├── build/                    # Built frontend
│   ├── package.json
│   └── ...
├── wdoi-backend/                 # Backend API
│   ├── package.json
│   └── ...
├── .env.production               # Production environment variables
├── ecosystem.config.js           # PM2 configuration
├── nginx.conf                    # NGINX configuration
└── logs/                         # Application logs
    ├── frontend.log
    ├── backend.log
    └── nginx/
```

### System directories:
```
/etc/nginx/sites-available/wdoi.io    # NGINX configuration
/etc/nginx/sites-enabled/wdoi.io      # Active configuration
/var/log/wdoi/                        # Application logs
/etc/letsencrypt/live/wdoi.io/         # SSL certificates
```

---

## 🔧 CONFIGURATION FILES

### 1. PM2 Ecosystem (ecosystem.config.js)
- **Purpose:** PM2 process configuration
- **Location:** `/var/www/wdoi/ecosystem.config.js`
- **Status:** ⏳ Ready to copy

### 2. NGINX Configuration (nginx.conf)
- **Purpose:** Reverse proxy, SSL, security headers
- **Location:** `/etc/nginx/sites-available/wdoi.io`
- **Status:** ⏳ Ready to copy

### 3. Environment File (.env.production)
- **Purpose:** Production environment variables
- **Location:** `/var/www/wdoi/.env.production`
- **Status:** ⏳ Ready to copy

---

## 🔒 SECURITY SETTINGS

### Planned security configurations:
- [ ] UFW Firewall (ports 22, 80, 443)
- [ ] Let's Encrypt SSL certificates
- [ ] NGINX security headers
- [ ] Rate limiting
- [ ] Fail2ban (optional)

### SSH configuration:
- [x] Key-based access configured
- [x] User: rebanda
- [ ] Disable password authentication (recommended)

---

## 📊 MONITORING AND LOGS

### PM2 monitoring commands:
```bash
pm2 status              # Status of all processes
pm2 logs                # View logs
pm2 monit              # Real-time monitoring
pm2 restart all        # Restart all processes
pm2 reload all         # Graceful restart
pm2 stop all           # Stop all processes
```

### NGINX commands:
```bash
sudo systemctl status nginx    # NGINX status
sudo nginx -t                  # Configuration check
sudo systemctl reload nginx    # Reload configuration
sudo tail -f /var/log/nginx/access.log  # Access logs
```

---

## 🚨 BACKUP AND RECOVERY

### Important files for backup:
```bash
# Configuration files
/var/www/wdoi/ecosystem.config.js
/var/www/wdoi/.env.production
/etc/nginx/sites-available/wdoi.io

# SSL certificates
/etc/letsencrypt/live/wdoi.io/

# PM2 configuration
~/.pm2/
```

### Backup commands:
```bash
# Create configuration archive
tar -czf wdoi-config-backup-$(date +%Y%m%d).tar.gz \
  /var/www/wdoi/ecosystem.config.js \
  /var/www/wdoi/.env.production \
  /etc/nginx/sites-available/wdoi.io

# Save PM2 configuration
pm2 save
pm2 dump > pm2-processes-backup.json
```

---

## 🔄 UPDATE PROCEDURES

### Code updates:
```bash
cd /var/www/wdoi
git pull origin main
cd web-app && npm run build
pm2 reload all
```

### Dependencies update:
```bash
cd /var/www/wdoi/web-app && npm ci --production
cd ../wdoi-backend && npm ci --production
pm2 restart all
```

---

## 📞 CONTACTS AND NOTES

**Developer:** Claude  
**Documentation Created:** 2024-11-12  
**Last Updated:** 2024-11-12  

### Notes:
- Server has been stable for 97 days
- CentOS Stream 9 is a stable enterprise system
- Server resources are sufficient for production load
- SSH access is securely configured

---

*This document will be updated as installation progresses*
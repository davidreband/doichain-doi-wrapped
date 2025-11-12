# Production Deployment Guide for Wrapped DOI Chain

## Server Information
- **IP Address:** 45.83.141.11
- **Username:** rebanda
- **SSH Access:** `ssh rebanda@45.83.141.11`

## Prerequisites

### 1. Server Setup
```bash
# Connect to server
ssh rebanda@45.83.141.11

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx nodejs npm build-essential

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install PM2 globally
sudo npm install -g pm2

# Install Let's Encrypt certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Domain Configuration
Make sure your domain `wdoi.io` points to `45.83.141.11`:
- A record: `wdoi.io` → `45.83.141.11`
- A record: `www.wdoi.io` → `45.83.141.11`

## Deployment Steps

### 1. Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/your-username/wrapped-doichain.git wdoi
sudo chown -R rebanda:rebanda /var/www/wdoi
cd /var/www/wdoi
```

### 2. Configure Environment
```bash
# Copy production environment
cp .env.production .env

# Edit production configuration
nano .env.production

# Update the following values:
# PRIVATE_KEY=your_actual_private_key
# ETHERSCAN_API_KEY=your_actual_etherscan_key
# SESSION_SECRET=generate_secure_session_secret
# SENTRY_DSN=your_sentry_dsn (optional)
```

### 3. SSL Certificate Setup
```bash
# Stop nginx if running
sudo systemctl stop nginx

# Generate SSL certificates
sudo certbot certonly --standalone -d wdoi.io -d www.wdoi.io

# Setup automatic renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Build Frontend
```bash
cd /var/www/wdoi/web-app

# Install dependencies
npm ci --production

# Build for production
npm run build

# Create logs directory
sudo mkdir -p /var/log/wdoi
sudo chown -R rebanda:rebanda /var/log/wdoi
```

### 5. Setup Backend
```bash
cd /var/www/wdoi/wdoi-backend

# Install dependencies
npm ci --production

# Test backend
npm start &
curl http://localhost:3001/health
# Should return "OK"
pkill -f "node"
```

### 6. Configure NGINX
```bash
# Copy NGINX configuration
sudo cp /var/www/wdoi/nginx.conf /etc/nginx/sites-available/wdoi.io

# Enable site
sudo ln -s /etc/nginx/sites-available/wdoi.io /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test NGINX configuration
sudo nginx -t

# Start NGINX
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 7. Deploy with PM2
```bash
cd /var/www/wdoi

# Start applications with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Run the command it outputs

# Monitor applications
pm2 status
pm2 logs
```

### 8. Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

## Docker Alternative Deployment

If you prefer using Docker:

```bash
cd /var/www/wdoi

# Build and start with Docker Compose
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check frontend
curl https://wdoi.io/health

# Check backend API
curl https://wdoi.io/api/health

# Check PM2 status
pm2 status

# Check NGINX status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates
```

### Log Management
```bash
# View application logs
pm2 logs

# View NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/log/wdoi/frontend.log
tail -f /var/log/wdoi/backend.log
```

### Updates
```bash
cd /var/www/wdoi

# Pull latest changes
git pull origin main

# Update frontend
cd web-app
npm ci --production
npm run build

# Update backend
cd ../wdoi-backend
npm ci --production

# Restart applications
pm2 restart all

# Or reload without downtime
pm2 reload all
```

## Security Checklist

- ✅ SSL certificates configured
- ✅ Firewall enabled (UFW)
- ✅ NGINX security headers configured
- ✅ Rate limiting enabled
- ✅ Process isolation with PM2
- ✅ Log rotation configured
- ✅ Regular security updates
- ✅ Non-root user for applications

## Troubleshooting

### Common Issues

1. **Port 80/443 already in use:**
   ```bash
   sudo lsof -i :80
   sudo lsof -i :443
   ```

2. **PM2 applications not starting:**
   ```bash
   pm2 logs
   pm2 restart all
   ```

3. **SSL certificate issues:**
   ```bash
   sudo certbot renew --dry-run
   ```

4. **NGINX configuration errors:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Performance Optimization

1. **Enable Cloudflare (Optional):**
   - Add domain to Cloudflare
   - Configure SSL/TLS to "Full (strict)"
   - Enable security features

2. **Database Optimization:**
   - Configure Redis for caching
   - Setup database connection pooling

3. **Monitoring:**
   - Setup Sentry for error tracking
   - Configure Google Analytics
   - Use PM2 monitoring dashboard

## Contact

For support during deployment, ensure all configurations match your specific environment and update any placeholder values with actual production data.
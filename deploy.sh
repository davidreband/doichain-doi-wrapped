#!/bin/bash

# Production Deployment Script for Wrapped DOI Chain
# Server: rebanda@45.83.141.11

set -e  # Exit on any error

echo "🚀 Starting Wrapped DOI Chain deployment..."

# Configuration
SERVER_USER="rebanda"
SERVER_IP="45.83.141.11"
DOMAIN="wdoi.io"
PROJECT_DIR="/var/www/wdoi"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run commands on remote server
run_remote() {
    ssh $SERVER_USER@$SERVER_IP "$1"
}

# 1. Setup server dependencies
setup_server() {
    print_status "Setting up server dependencies..."
    
    run_remote "
        sudo apt update && sudo apt upgrade -y
        sudo apt install -y curl wget git nginx nodejs npm build-essential
        
        # Install PM2
        sudo npm install -g pm2
        
        # Install Let's Encrypt
        sudo apt install -y certbot python3-certbot-nginx
        
        # Create project directory
        sudo mkdir -p $PROJECT_DIR
        sudo chown -R $SERVER_USER:$SERVER_USER $PROJECT_DIR
        
        # Create logs directory
        sudo mkdir -p /var/log/wdoi
        sudo chown -R $SERVER_USER:$SERVER_USER /var/log/wdoi
    "
}

# 2. Deploy application files
deploy_files() {
    print_status "Deploying application files..."
    
    # Copy files to server
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'temp' \
          ./ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/
    
    run_remote "
        cd $PROJECT_DIR
        
        # Setup production environment
        cp .env.production .env
        
        # Build frontend
        cd web-app
        npm ci --production
        npm run build
        
        # Setup backend
        cd ../wdoi-backend
        npm ci --production
    "
}

# 3. Configure SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    run_remote "
        # Stop nginx if running
        sudo systemctl stop nginx 2>/dev/null || true
        
        # Generate SSL certificates
        sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Setup auto-renewal
        echo '0 12 * * * /usr/bin/certbot renew --quiet' | sudo crontab -
    "
}

# 4. Configure NGINX
setup_nginx() {
    print_status "Configuring NGINX..."
    
    run_remote "
        cd $PROJECT_DIR
        
        # Copy NGINX configuration
        sudo cp nginx.conf /etc/nginx/sites-available/$DOMAIN
        
        # Enable site
        sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test configuration
        sudo nginx -t
        
        # Enable and start NGINX
        sudo systemctl enable nginx
        sudo systemctl start nginx
    "
}

# 5. Start applications with PM2
start_applications() {
    print_status "Starting applications with PM2..."
    
    run_remote "
        cd $PROJECT_DIR
        
        # Stop any existing PM2 processes
        pm2 delete all 2>/dev/null || true
        
        # Start applications
        pm2 start ecosystem.config.js --env production
        
        # Save PM2 configuration
        pm2 save
        
        # Setup PM2 startup
        pm2 startup systemd -u $SERVER_USER --hp /home/$SERVER_USER
    "
}

# 6. Configure firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    run_remote "
        sudo ufw --force reset
        sudo ufw allow OpenSSH
        sudo ufw allow 'Nginx Full'
        sudo ufw --force enable
    "
}

# 7. Health check
health_check() {
    print_status "Performing health checks..."
    
    sleep 10  # Wait for services to start
    
    # Check if services are running
    run_remote "
        # Check PM2 status
        pm2 status
        
        # Check NGINX status
        sudo systemctl status nginx --no-pager -l
    "
    
    # Test endpoints
    print_status "Testing endpoints..."
    curl -f https://$DOMAIN/health || print_warning "Frontend health check failed"
    curl -f https://$DOMAIN/api/health || print_warning "Backend health check failed"
}

# Main deployment function
main() {
    echo "🔧 Deploying to server: $SERVER_USER@$SERVER_IP"
    echo "🌐 Domain: $DOMAIN"
    echo "📁 Project directory: $PROJECT_DIR"
    echo ""
    
    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
    
    setup_server
    deploy_files
    setup_ssl
    setup_nginx
    start_applications
    setup_firewall
    health_check
    
    print_status "🎉 Deployment completed successfully!"
    print_status "🔗 Your application is now available at: https://$DOMAIN"
    print_status "📊 PM2 dashboard: pm2 monit"
    print_status "📋 Logs: pm2 logs"
}

# Run main function
main "$@"
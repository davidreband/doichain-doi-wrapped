module.exports = {
  apps: [
    {
      name: 'wdoi-frontend',
      script: 'node_modules/.bin/serve',
      args: '-s build -l 3000',
      cwd: './web-app',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Restart configuration
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging
      log_file: '/var/log/wdoi/frontend.log',
      error_file: '/var/log/wdoi/frontend-error.log',
      out_file: '/var/log/wdoi/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      
      // Health monitoring
      health_check_url: 'http://localhost:3000',
      health_check_grace_period: 3000
    },
    {
      name: 'wdoi-backend',
      script: 'npm',
      args: 'start',
      cwd: './wdoi-backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      
      // Restart configuration
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging
      log_file: '/var/log/wdoi/backend.log',
      error_file: '/var/log/wdoi/backend-error.log',
      out_file: '/var/log/wdoi/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      
      // Health monitoring
      health_check_url: 'http://localhost:3001/health',
      health_check_grace_period: 3000,
      
      // Auto restart on file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs']
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/wrapped-doichain.git',
      path: '/var/www/wdoi',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    }
  }
};
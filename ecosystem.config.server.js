module.exports = {
  apps: [
    {
      name: 'wdoi-frontend-server',
      script: 'node',
      args: 'server.js',
      cwd: './web-app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      // Restart configuration
      max_memory_restart: '512M',
      restart_delay: 2000,
      max_restarts: 5,
      min_uptime: '5s',
      
      // Logging
      log_file: './logs/frontend.log',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'wdoi-backend-server',
      script: 'src/app.js',
      cwd: './wdoi-backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      
      // Restart configuration
      max_memory_restart: '256M',
      restart_delay: 2000,
      max_restarts: 5,
      min_uptime: '5s',
      
      // Logging
      log_file: './logs/backend.log',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      
      // Auto restart on file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs']
    }
  ]
};
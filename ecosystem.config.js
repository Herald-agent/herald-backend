module.exports = {
  apps: [{
    name: 'herald-backend',
    script: 'server.js',
    cwd: '/home/ubuntu/herald-backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    max_memory_restart: '256M',
    exp_backoff_restart_delay: 100,
    watch: false,
    autorestart: true,
    max_restarts: 10,
  }]
};

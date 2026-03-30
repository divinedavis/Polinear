module.exports = {
  apps: [{
    name: 'polinear',
    script: 'npm',
    args: 'start',
    cwd: '/root/Polinear',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};

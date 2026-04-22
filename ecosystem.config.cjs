// PM2 process config for production.
// Запуск: pm2 start ecosystem.config.cjs
// После первого старта сохранить: pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: "saga",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,              // для 2 ГБ RAM достаточно одного инстанса
      exec_mode: "fork",
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",   // слушаем только localhost, Nginx проксирует снаружи
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      time: true,
    },
  ],
};

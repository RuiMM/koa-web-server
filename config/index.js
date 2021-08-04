const config = {
  host: process.env.IP || 'localhost',
  port: process.env.PORT || 6020,
  logSQL: false,
  isLocal: process.env.NODE_ENV === 'local', // 本地环境
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASS || 'your password',
    database: process.env.DB_NAME || 'demo',
  },
  tokenSecretKey: 'your token secretKey',
};

module.exports = config;

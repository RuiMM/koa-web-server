const config = {
  host: process.env.IP || 'localhost',
  port: process.env.PORT || 6020,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'demo',
  },
  tokenSecretKey: 'your token secretKey',
};

module.exports = config;

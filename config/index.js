const config = {
  host: process.env.IP || 'localhost',
  port: process.env.PORT || 6020,
  logSQL: false,
  isLocal: process.env.NODE_ENV === 'local', // 本地环境
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },
  tokenSecretKey: process.env.TOKEN_SECRETKEY,
};

module.exports = config;

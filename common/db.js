const knex = require('knex');

const clientCached = {}; // 缓存连接
const md5 = require('md5');
const config = require('../config');

function dbConn(connection = {}, options = {}) {
  const {
    host, port, user, password, database, client = 'mysql', pool,
  } = connection;

  const knexConnection = {
    host,
    port,
    user,
    password,
    database,
  };

  const clientKey = md5(JSON.stringify(knexConnection));

  let knexClient = clientCached[clientKey];

  if (!knexClient) {
    knexClient = knex({
      client,
      connection: knexConnection,
      pool: {
        min: 0,
        max: 15,
        ...pool,
      },
      ...options,
    });
    clientCached[clientKey] = knexClient;
  }

  return knexClient;
}

module.exports = {
  dbConn,
  demo: dbConn(config.db),
};

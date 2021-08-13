const logs = require('../common/logs');

module.exports = () => async (ctx, next) => {
  const start = new Date();
  await next();
  const end = new Date();
  logs.access.info({
    ...logs.accessDefaultConfig(ctx, start, end),
    returned: ctx.body,
  });
};

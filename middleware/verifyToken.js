const jwt = require('../common/jwt');

module.exports = {
  verifyToken(options = {}) {
    const { publicPath = [] } = options;
    return async (ctx, next) => {
      // 公开路径不校验
      if (publicPath.includes(ctx.path)) {
        return next();
      }
      // 校验token
      const token = ctx.headers['xxxx-token'];

      jwt.verfiyToken(token);

      return next();
    };
  },
};

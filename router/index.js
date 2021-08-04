const Router = require('koa-router');
const demoCtrl = require('../controller/demo');
const { verifyToken } = require('../middleware/verifyToken');
const jwt = require('../common/jwt');

const router = new Router({
  prefix: '/api',
});

router.post('/login', (ctx) => {
  // 登陆逻辑

  // 下发token
  const token = jwt.signToken();

  ctx.body = {
    token,
  };
});

router.post('/queryDemos', verifyToken(), demoCtrl.queryDemos);

module.exports = router;

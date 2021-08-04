const demoService = require('../service/demo');

module.exports = {
  async queryDemos(ctx) {
    const params = ctx.request.body;
    const { page, size, name } = params;
    const whereFn = (select) => {
      if (name) {
        select.where('name', 'like', `%${name}%`);
      }
    };
    const [demos, total] = await Promise.all([
      demoService.findPage({}, {
        page,
        size,
        fn: whereFn,
      }),
      demoService.count({}, {
        fn: whereFn,
      }),
    ]);
    ctx.body = {
      demos,
      total,
    };
  },
};

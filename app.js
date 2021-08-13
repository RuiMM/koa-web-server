require('dotenv').config();
const Koa = require('koa');
const koaCors = require('@koa/cors');
const koaBody = require('koa-body');
const config = require('./config');
const ServiceError = require('./common/ServiceError');
const accessLog = require('./middleware/accessLog');

const app = new Koa();

app.use(koaCors());
app.use(accessLog());
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 10 * 1024 * 1024,
  },
  onError(err) {
    throw new ServiceError({
      message: '解析参数失败',
      data: err.message,
    });
  },
}));

app.use(require('./router').routes());

app.host = config.host;
app.port = config.port;

// 启动服务
const server = app.listen(app.port, app.host, () => {
  console.log('服务监听： http://%s:%d', server.address().address, server.address().port);
});

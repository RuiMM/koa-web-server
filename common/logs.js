// 日志
const moment = require('moment');
const winston = require('winston');
require('winston-daily-rotate-file');

// 过滤字符，便于阅读
const encode = (s) => s.replace(/\\/g, '\\x5C').replace(/"/, '\\x22');

const wformat = ({ label }) => (winston.format.combine(
  winston.format.label({ label }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(),
));

const createTransports = ({ fileName }) => {
  const ts = [new winston.transports.Console()];
  ts.push(new winston.transports.DailyRotateFile({
    filename: `${fileName}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    // dirname: `/data/logs/${fileName}`,
  }));
  return ts;
};

module.exports = {
  app: winston.createLogger({
    format: wformat({ label: '应用日志' }),
    transports: createTransports({ fileName: 'app' }),
  }),

  appDefaultConfig: () => {},

  access: winston.createLogger({
    format: wformat({ label: '访问日志' }),
    transports: createTransports({ fileName: 'access' }),
  }),

  accessDefaultConfig: (ctx, start, end) => ({
    ip: ctx.ip,
    Xip: encode(ctx.headers['x-real-ip'] || ctx.headers['x-forwarded-for'] || ctx.socket.remoteAddress || '-'),
    date: moment().format('YYYY/MM/DD HH:mm:ss'),
    userAgent: encode(ctx.headers['user-agent'] || '-'),
    method: ctx.method,
    host: encode(ctx.headers.host || '-'),
    protocol: ctx.protocol,
    referer: encode(ctx.headers.referer || '-'),
    path: ctx.path,
    href: ctx.href,
    status: ctx.status,
    start: moment(start).format('YYYY/MM/DD HH:mm:ss'),
    end: moment(end).format('YYYY/MM/DD HH:mm:ss'),
    delta: end - start,
    length: ctx.length ? ctx.length.toString() : '-',
  }),

  operation: winston.createLogger({
    format: wformat({ label: '用户操作日志' }),
    transports: createTransports({ fileName: 'operation' }),
  }),

  operationDefaultConfig: () => {},
};

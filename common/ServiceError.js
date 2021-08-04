class ServiceError extends Error {
  // 服务错误
  // fatal: true 为严重错误，会输出日志，需要处理
  // fatal: false 为业务错误，默认不会输出到日志
  // status: 返回状态吗
  // output: 是否输出原始 message，严重错误时，默认不输出
  constructor(params = {}, cause) {
    let { message = '' } = params;
    const {
      code = '', data, fatal = false, output, status, stack,
    } = params;
    if (typeof params === 'string') {
      message = params;
    }
    message = message || '未知错误';
    super(message);
    this.message = message;
    this.name = 'ServiceError';
    this.fatal = fatal;
    this.code = code;
    this.data = data;
    this.status = status;
    this.output = output === undefined ? !fatal : output;

    if (stack) {
      this.stack = `Error: ${this.message}\n--------------------\n${stack}`;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    if (cause && cause.stack) {
      this.stack += `\n--------------------\nCaused by: \n${cause.stack}`;
    }
  }

  // 是否致命错误
  static isFatalError(err) {
    let flag = false;
    if (err) {
      if (!(err instanceof ServiceError)) {
        flag = true;
      } else {
        flag = err.fatal;
      }
    }
    return flag;
  }
}

module.exports = ServiceError;

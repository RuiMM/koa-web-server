const BaseService = require('./BaseService');

class DemoService extends BaseService {
  constructor(options = {}) {
    super(options);
    this.name = 'demo';
    this.table = 'demo';
    this.idKey = 'demo_id';
    this.jsonArrayKeys = [];
    this.jsonObjectKeys = [];
  }
  // 其他业务逻辑
}

module.exports = new DemoService();

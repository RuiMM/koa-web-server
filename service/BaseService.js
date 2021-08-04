const { demo } = require('../common/db');
const config = require('../config');
const ServiceError = require('../common/ServiceError');

class BaseService {
  constructor(options = {}) {
    this.knex = demo;
    this.options = options;

    this.debug = config.isLocal || config.logSQL;
    this.name = 'service基类'; // 模块名称
    this.table = options.table; // 表名
    this.idKey = 'id'; // 主键
    this.jsonArrayKeys = []; // json数据组列
    this.jsonObjectKeys = []; // json对象列

    this.ascOrder = ['ascending', 'asc'];
  }

  get model() {
    return this.knex(this.table);
  }

  async remove(where = {}) {
    const res = await this.removeDao(where);
    return res;
  }

  async removeDao(where = {}) {
    where = this.filterUndefinedKeys(where);
    this.checkEmptyWhere(where);

    const { model } = this;
    const action = this.buildWhere(model, where).del();
    const res = await this.doExecute(action);

    return res;
  }

  // 返回添加后的id
  async addDao(params = {}) {
    params = this.filterUndefinedKeys(params);
    params = this.stringifyRow(params);

    const { model } = this;
    const action = model.insert(params, this.idKey);
    const res = await this.doExecute(action);

    return res[0];
  }

  // 添加并返回添加后的数据
  async add(params = {}) {
    const id = await this.addDao(params);
    const data = await this.findOne({ [this.idKey]: id });
    return data;
  }

  // 更新完后并返回更新后的数据，需要主键
  async update(params = {}) {
    await this.updateDao(params);
    const data = await this.findOne({ [this.idKey]: params[this.idKey] });
    return data;
  }

  // 根据主键，只更新数据
  async updateDao(params) {
    const key = params[this.idKey];
    if (!key) {
      throw new ServiceError({
        message: '主键不能为空',
        code: 'idkey_required',
        fatal: true,
      });
    }
    const where = { [this.idKey]: key };
    const cnt = await this.updateBy(params, where);
    return cnt;
  }

  // 只更新数据
  async updateBy(params = {}, where = {}) {
    params = this.filterUndefinedKeys(params);
    this.checkEmptyWhere(where);
    params = this.stringifyRow(params);

    const { model } = this;
    const action = model.update(params).where(where);
    const res = await this.doExecute(action);

    return res;
  }

  async findOne(where = {}, options = {}) {
    const row = await this.findDao(where, options);
    return row;
  }

  async findDao(where = {}, options = {}) {
    const { whereNot = {}, columns = '*' } = options;
    this.checkEmptyWhere({ ...where, ...whereNot });

    const { model } = this;
    const select = model.select(columns).where(where).whereNot(whereNot).limit(1);
    const rows = await this.doExecute(select);
    const row = this.parseRow(rows[0], true);

    return row;
  }

  // 如果不存在，会抛业务异常
  async findDaoThrow(where = {}, options = {}) {
    const { fatal = false } = options;
    const row = await this.findDao(where, options);
    if (!row) {
      throw new ServiceError({
        message: `${this.name || '数据'}不存在`,
        code: 'data:not_found',
        fatal,
      });
    }
    return row;
  }

  // 如果不存在会抛致命错误，需要处理
  async findDaoError(where = {}, options = {}) {
    const row = await this.findDaoThrow(where, {
      ...options,
      fatal: true,
    });
    return row;
  }

  // 如果不存在，会抛业务异常
  async findOneThrow(where = {}, options = {}) {
    const { fatal = false } = options;
    const row = await this.findOne(where, options);
    if (!row) {
      throw new ServiceError({
        message: `${this.name || '数据'}不存在`,
        code: 'data:not_found',
        fatal,
      });
    }
    return row;
  }

  // 如果不存在会抛致命错误，需要处理
  async findOneError(where = {}, options = {}) {
    const row = await this.findOneThrow(where, {
      ...options,
      fatal: true,
    });
    return row;
  }

  // options: { sort: [{ column, order }],
  //    whereNot = {}, columns = '*',
  //    offset = 0, limit = -1, fn }
  // where: { column1: '', column2: [1, 2] } | function
  async findAll(where = {}, options = {}) {
    const rows = await this.findAllDao(where, options);
    return rows;
  }

  // options: { sort: [{ column, order }],
  //   whereNot = {}, columns = '*', offset = 0,
  //   limit = -1, fn }
  // where: { column1: '', column2: [1, 2] } | function
  async findAllDao(where = {}, options = {}) {
    let { fn } = options;
    const {
      whereNot = {}, columns = '*', sort = [], offset = 0, limit = -1,
    } = options;
    const { model } = this;

    const select = model.select(columns).whereNot(whereNot);

    if (typeof where === 'function') {
      fn = where;
    } else {
      // 支持自动 where in
      this.buildWhere(select, where);
    }

    if (offset > 0) {
      select.offset(offset);
    }
    if (limit > -1) {
      select.limit(limit);
    }

    if ((Array.isArray(sort) && sort.length) || sort) {
      select.orderBy(sort);
    }

    if (typeof fn === 'function') {
      fn.call(this, select);
    }

    const rows = await this.doExecute(select);

    rows.forEach((row) => {
      this.parseRow(row, true);
    });

    return rows;
  }

  // options: { page, size, sortBy, sortWay }
  // where: { column1: '', column2: [1, 2] } | function
  async findPage(where = {}, options = {}) {
    const rows = await this.findPageDao(where, options);
    return rows;
  }

  // 分页查询
  // options: { page, size, sortBy, sortWay }
  // where: { column1: '', column2: [1, 2] } | function
  async findPageDao(where = {}, options = {}) {
    const {
      page = 1, size = 20, sortBy = this.idKey, sortWay = 'desc',
    } = options;
    const limit = size;
    const offset = page > 0 && size > -1 ? (page - 1) * size : -1;
    let sort = [];

    if (size > 100000 || size < 0) {
      throw new ServiceError({
        message: '查询数据过多',
      });
    }

    if (sortBy) {
      if (Array.isArray(sortBy)) {
        const isArrSort = Array.isArray(sortWay);
        sort = sortBy.map((by, i) => ({
          column: by,
          order: isArrSort ? sortWay[i] : sortWay,
        }));
      } else {
        sort.push({
          column: sortBy,
          order: sortWay,
        });
      }
    }

    const res = await this.findAllDao(where, {
      sort,
      ...options,
      offset,
      limit,
    });
    return res;
  }

  // where: { column1: '', column2: [1, 2] } | function
  async count(where = {}, options = {}) {
    let { fn } = options;
    const { whereNot = {} } = options;

    const { model } = this;
    const select = model.count('* as count').whereNot(whereNot);

    if (typeof where === 'function') {
      fn = where;
    } else {
      // 支持自动 where in
      this.buildWhere(select, where);
    }

    if (typeof fn === 'function') {
      fn.call(this, select);
    }

    const rows = await this.doExecute(select);
    const total = rows.length ? rows[0].count : 0;

    return total;
  }

  async raw(sql = '', params = []) {
    const select = this.knex.raw(sql, params);
    const res = await this.doExecute(select);
    return res;
  }

  async doExecute(select) {
    let trace = null;
    try {
      trace = new Error('[DB] doExecute error');
      const res = await select;
      return res;
    } catch (err) {
      // 执行错误都是严重错误，需要处理
      // 除了列不存在等不重要错误
      throw new ServiceError(
        {
          message: err.sqlMessage || err.message,
          code: err.code,
          stack: trace.stack,
          fatal: !['ER_BAD_FIELD_ERROR'].includes(err.code),
        },
        err,
      );
    } finally {
      if (this.debug && select) {
        console.log(`[${this.table}]`, select.toString());
      }
    }
  }

  parseRow(row, modify = false) {
    row = modify ? row : { ...row };
    this.parseRowJson(row, this.jsonArrayKeys, []);
    this.parseRowJson(row, this.jsonObjectKeys, {});
    return row;
  }

  stringifyRow(row, modify = false) {
    row = modify ? row : { ...row };
    this.stringifyRowJson(row, this.jsonArrayKeys);
    this.stringifyRowJson(row, this.jsonObjectKeys);
    return row;
  }

  // 规范
  formatOrderWay(orderWay = '') {
    return this.ascOrder.includes(orderWay.toLowerCase()) ? 'asc' : 'desc';
  }

  // 更友好一点的 where，支持数组 { a: [1, 2] }, 过滤掉一些空查询: false, undefined, ''
  buildWhere(select, where = {}) {
    Object.keys(where).forEach((key) => {
      const value = where[key];
      if (Array.isArray(value)) {
        if (value.length === 1) {
          select.where(key, value[0]);
        } else {
          select.whereIn(key, value);
        }
      } else if (value || value === 0 || value === null) {
        select.where(key, value);
      }
    });
    return select;
  }

  // 过滤掉没有设置的 key
  filterUndefinedKeys(where = {}, modify = false) {
    const params = modify ? where : { ...where };
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value === undefined) {
        delete params[key];
      }
    });
    return params;
  }

  // 防止空的where执行
  checkEmptyWhere(where = {}) {
    if (!where || !Object.keys(where).length) {
      throw new ServiceError({
        code: 'empty_where',
        message: '参数不能为空',
        fatal: true,
      });
    }
  }

  // 解析 json 列，并带上默认值，一般用在取出数据前
  parseRowJson(row, keys = [], dv = {}) {
    if (row) {
      keys.forEach((key) => {
        try {
          const val = row[key];
          if (typeof val === 'string' && val) {
            row[key] = JSON.parse(val);
          }
          if (!row[key]) {
            row[key] = dv;
          }
        } catch (err) {
          console.error('parseRowJson', key, row[key], err);
          row[key] = dv;
        }
      });
    }
    return row;
  }

  // 序列json列，一般用在存数据库前
  stringifyRowJson(row, keys = []) {
    if (row) {
      keys.forEach((key) => {
        if (row[key] && typeof row[key] !== 'string') {
          row[key] = JSON.stringify(row[key]);
        }
      });
    }
    return row;
  }
}

module.exports = BaseService;

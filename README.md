## 基于koa2+knex搭建的node服务

### 
```
#克隆项目
git clone https://github.com/RuiMM/koa-web-server.git

#安装依赖
npm i

#开发
node app.js
```

### 目录结构
- `common` 公共模块
- `config` 配置模块
- `controller/*` 控制层
- `middleware` 中间件
- `router` 路由
- `service` 业务层
    - `service/BaseService.js` 基于knex封装的一些常用API
- `package.json` 项目信息
- `app.js` 入口
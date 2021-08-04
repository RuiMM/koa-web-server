const jwt = require('jsonwebtoken');
const { tokenSecretKey } = require('../config');
const ServiceError = require('./ServiceError');

module.exports = {
  signToken(data, secretKey, options) {
    secretKey = secretKey || tokenSecretKey;
    const token = jwt.sign(data, secretKey, { expiresIn: '1d', ...options });
    return token;
  },
  verfiyToken(token, secretKey) {
    secretKey = secretKey || tokenSecretKey;
    let data = null;
    try {
      data = jwt.verify(token, secretKey);
    } catch (err) {
      throw new ServiceError({
        message: 'token失效',
        data: err.message,
      });
    }
    return data;
  },
};

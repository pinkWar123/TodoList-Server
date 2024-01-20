const jwt = require('jsonwebtoken');

const generateTokens = (response) => {
  const token = jwt.sign({ _id: response._id }, process.env.SECRET_KEY, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ _id: response._id }, process.env.SECRET_KEY_REFRESH, {
    expiresIn: '7d',
  });
  return { token, refreshToken };
};

module.exports = generateTokens;

const jwt = require('jsonwebtoken');

const checkLogin = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No access token provided' });

  try {
    const data = jwt.verify(token, process.env.SECRET_KEY);
    req.data = data;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = checkLogin;

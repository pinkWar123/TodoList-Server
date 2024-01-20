var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const AccountModel = require('../models/account');

/* GET home page. */

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

router.get('/', checkLogin, async (req, res, next) => {
  const { _id } = req.data;

  try {
    const user = await AccountModel.findById(_id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

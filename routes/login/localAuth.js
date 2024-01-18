const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const AccountModel = require('../../models/account');

router.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const data = await AccountModel.findOne({ username });
    console.log(data);
    if (data) {
      if (data.password === password) {
        const token = jwt.sign({ _id: data._id }, process.env.SECRET_KEY, { expiresIn: process.env.TOKEN_MAX_AGE });
        const refreshToken = jwt.sign({ _id: data._id }, process.env.SECRET_KEY_REFRESH, {
          expiresIn: process.env.REFRESH_TOKEN_MAX_AGE,
        });
        return res.status(200).json({
          message: 'Success',
          token,
          refreshToken,
        });
      }
    } else return res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    return res.status(404).json({ message: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const AccountModel = require('../../models/account');
const generateTokens = require('../../utils/generateTokens');

router.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const data = await AccountModel.findOne({ username });
    console.log(data);
    if (data) {
      if (data.password === password) {
        const { token, refreshToken } = generateTokens(data);
        return res.status(200).json({
          message: 'Success',
          token,
          refreshToken,
          user: data,
        });
      }
    } else return res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    return res.status(404).json({ message: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'No refresh token found!' });
    const response = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH);
    const { _id } = response;
    const user = await AccountModel.findById(_id);
    const tokens = generateTokens(user);
    return res.status(200).json({
      message: 'Success',
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.post('/social', async (req, res, next) => {
  const { socialId, name, provider } = req.body;
  try {
    let response = {};
    const data = await AccountModel.findOne({ socialId, provider });
    if (data) {
      response = data;
    } else {
      response = await AccountModel.create({
        name,
        provider,
        socialId,
      });
    }
    const { token, refreshToken } = generateTokens(response);
    return res.status(200).json({
      message: 'Success',
      token,
      refreshToken,
      user: response,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

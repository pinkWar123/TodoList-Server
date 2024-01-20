const express = require('express');
const router = express.Router();
const AccountModel = require('../../models/account');

router.post('/', async (req, res, next) => {
  const { firstName, lastName, username, password } = req.body;

  try {
    const data = await AccountModel.findOne({ username, password });
    if (data) {
      return res.status(409).json({ message: 'Account has already existed' });
    }

    try {
      const response = await AccountModel.create({
        username,
        password,
        name: firstName + ' ' + lastName,
      });
      if (response) return res.status(200).json({ message: 'Account has successfully been created' });
      else return res.status(400).json({ message: 'Failed to create account' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;

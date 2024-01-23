const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const TaskModel = require('../models/task');
const AccountModel = require('../models/account');

// router.use((req, res, next) => {
//   const token = req.headers?.authorization.split(' ')[1];
//   if (!authInfo) {
//     return res.status(400).json({ message: 'Missing _id in request body' });
//   }
//   try {
//     const userInfo = jwt.verify(token, process.env.SECRET_KEY);
//     req.user = userInfo;
//     console.log(userInfo);
//     return next();
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// });

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

router.get('/', checkLogin, async (req, res) => {
  const { _id } = req.data;
  if (!_id) return res.status(400).json({ message: 'Missing _id in request body' });

  try {
    const account = await AccountModel.findById(_id);
    const taskIds = account.tasks;
    const tasks = await TaskModel.find({ _id: { $in: taskIds } });
    return res.status(200).json(tasks);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/', checkLogin, async (req, res) => {
  const { _id } = req.data;
  const { taskName, description } = req.body;
  try {
    const newTask = await TaskModel.create({ taskName, description });
    const { _id: taskId } = newTask;
    const response = await AccountModel.updateOne({ _id }, { $push: { tasks: taskId } });
    if (response) return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/', checkLogin, async (req, res) => {
  const { _id } = req.data;
  const { _id: taskId } = req.body;

  try {
    let response = await TaskModel.deleteOne({ _id: taskId });
    if (response) {
      response = await AccountModel.updateOne({ _id }, { $pull: { tasks: taskId } });
      return res.status(200).json(response);
    }
    return res.status(400).json({ message: 'failed' });
  } catch (error) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const TaskModel = require('../models/task');
const AccountModel = require('../models/account');
const formatTimeZone = require('../utils/formatTimeZone');

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

const getAllTasks = async (req, res, next) => {
  const { _id } = req.data;
  if (!_id) return res.status(400).json({ message: 'Missing _id in request body' });

  try {
    const account = await AccountModel.findById(_id);
    const taskIds = account.tasks;
    const tasks = await TaskModel.find({ _id: { $in: taskIds } });
    req.tasks = tasks;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

router.get('/', checkLogin, getAllTasks, async (req, res) => {
  return res.status(200).json(req.tasks);
});

const isToday = (ts, offset) => {
  if (!ts) return true;
  const now = formatTimeZone(new Date(), offset);
  const date = formatTimeZone(ts, offset);
  console.log(now, date);
  return (
    now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth() && now.getDate() === date.getDate()
  );
};

router.get('/today', checkLogin, getAllTasks, async (req, res) => {
  const { tasks } = req;
  const { _id } = req.data;
  const account = await AccountModel.findById(_id);
  const offset = account.offset;
  let todayTasks = [];
  if (Array.isArray(tasks) && tasks.length > 0)
    todayTasks = tasks.filter((task) => isToday(task.dueDate, offset) && task.status === 0);
  return res.status(200).json(todayTasks);
});

router.get('/overdue', checkLogin, getAllTasks, (req, res) => {
  const { tasks } = req;
  let todayTasks = [];
  const now = new Date();
  if (Array.isArray(tasks) && tasks.length > 0)
    todayTasks = tasks.filter((task) => task.dueDate < now && task.status === 0);
  return res.status(200).json(todayTasks);
});

router.post('/', checkLogin, async (req, res) => {
  const { _id } = req.data;
  const account = await AccountModel.findById(_id);
  const offset = account.offset;
  let value = req.body;
  value.dueDate = formatTimeZone(value.dueDate, offset);
  try {
    const newTask = await TaskModel.create(value);
    const { _id: taskId } = newTask;
    const response = await AccountModel.updateOne({ _id }, { $push: { tasks: taskId } });
    if (response) return res.status(200).json(response);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
});

router.put('/', checkLogin, async (req, res) => {
  const { _id, task } = req.body;

  try {
    const { taskName, description, dueDate, priority, status } = task;
    const response = await TaskModel.updateOne({ _id }, { taskName, description, dueDate, priority, status });
    if (response) return res.status(200).json();
    else return res.status(500).json({ message: err.message });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/completed', checkLogin, async (req, res) => {
  const { page, pageSize } = req.query;
  try {
    const tasks = await TaskModel.aggregate([
      { $match: { status: 1 } },
      {
        $addFields: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        },
      },
      {
        $group: {
          _id: '$date',
          date: { $first: '$date' }, // Preserve the date field
          tasks: { $push: '$$ROOT' }, // Store the entire task document in an array
          count: { $sum: 1 }, // Count the number of completed tasks for each date
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $match: { count: { $gt: 0 } },
      },
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: parseInt(pageSize),
      },
    ]);
    const formattedTasks = tasks.map(({ _id, tasks }) => ({
      date: _id,
      tasks,
    }));
    return res.status(200).json(formattedTasks);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
});

router.get('/completed/maxPage', checkLogin, async (req, res) => {
  try {
    const result = await TaskModel.aggregate([
      // Match completed tasks (status: 1)
      { $match: { status: 1 } },
      // Group completed tasks by the date portion of the completedAt field
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 }, // Count the number of completed tasks for each date
        },
      },
      // Count the number of unique dates with completed tasks
      { $group: { _id: null, totalDates: { $sum: 1 } } },
    ]);

    // Extract the total number of dates with completed tasks from the result
    const totalDatesWithCompletedTasks = result.length > 0 ? result[0].totalDates : 0;

    return res.status(200).json(totalDatesWithCompletedTasks);
  } catch (error) {
    console.error('Error counting dates with completed tasks:', error);
    throw error; // Forward the error to the caller
  }
});

router.put('/completed', checkLogin, async (req, res) => {
  const { _id } = req.body;
  if (!_id) return res.status(404).json({ message: 'No task id found' });
  const now = new Date();
  const offset = now.getTimezoneOffset();
  console.log(offset);
  try {
    const task = await TaskModel.findByIdAndUpdate(_id, {
      completedAt: new Date(now.getTime() - offset * 60000),
      status: 1,
    });
    return res.status(200).json();
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
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/due', checkLogin, async (req, res) => {
  const { taskId } = req.query;

  try {
    const task = await TaskModel.findById(taskId);
    if (task) {
      const dueDate = task.dueDate;
      return res.status(200).json(dueDate);
    } else return res.status(400).json({ message: 'No comment found' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/due', checkLogin, async (req, res) => {
  const { taskId, timestamp } = req.body;
  try {
    const task = await TaskModel.findById(taskId);
    if (task) {
      task.dueDate = timestamp;
      await task.save();
      return res.status(200).json();
    } else return res.status(400).json({ message: 'No comment found' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/due', checkLogin, async (req, res) => {
  const { taskId } = req.query;
  try {
    const task = await TaskModel.findByIdAndUpdate(taskId, { dueDate: null }, { new: true });
    if (!task) {
      return res.status(404).json();
    } else return res.status(200).json(task);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/priority', checkLogin, async (req, res) => {
  const { taskId } = req.query;
  if (!taskId) return res.status(404).json();
  try {
    const task = await TaskModel.findById(taskId);
    if (!task) return res.status(404).json();
    return res.status(200).json(task.priority);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/priority', checkLogin, async (req, res) => {
  const { taskId, priority } = req.body;
  try {
    const task = await TaskModel.findByIdAndUpdate(taskId, { priority });
    if (!task) return res.status(404).json();
    return res.status(200).json(task);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;

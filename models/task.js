const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/Todo');

const taskSchema = new Schema(
  {
    taskName: String,
    description: String,
    dueDate: Date,
  },
  { collection: 'Task' },
);

const TaskModel = mongoose.model('task', taskSchema);

module.exports = TaskModel;
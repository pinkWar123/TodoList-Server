const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/Todo');

const taskSchema = new Schema(
  {
    taskName: String,
    description: String,
    dueDate: Date,
    comments: [{ type: Schema.ObjectId, ref: 'Comment' }],
    priority: { type: Number, default: 4 },
    status: { type: Number, default: 0 }, // 0 means incompleted, 1 means completed
    completedAt: Date, //
  },
  { collection: 'Task' },
);

taskSchema.index({ completedAt: 1 });

const TaskModel = mongoose.model('task', taskSchema);

module.exports = TaskModel;

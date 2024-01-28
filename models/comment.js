const mongoose = require('../utils/getMongooseInstance');

const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  },
  { collection: 'Comment' },
);

const CommentModel = mongoose.model('comment', commentSchema);

module.exports = CommentModel;

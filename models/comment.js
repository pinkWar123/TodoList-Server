const mongoose = require('../utils/getMongooseInstance');

const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    authorName: String,
    emojis: {
      type: Object,
      default: {},
    },
    createdAt: { type: Date, default: Date.now() },
  },
  { collection: 'Comment' },
);

const CommentModel = mongoose.model('comment', commentSchema);

module.exports = CommentModel;

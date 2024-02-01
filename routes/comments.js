const express = require('express');
const router = express.Router();
const checkLogin = require('../utils/checkAuthenticated');
const CommentModel = require('../models/comment');
const TaskModel = require('../models/task');

module.exports = router;

router.get('/', checkLogin, async (req, res) => {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ message: 'Bad request' });
  try {
    const task = await TaskModel.findById(taskId);
    const commentIds = task.comments;
    const comments = await CommentModel.find({ _id: { $in: commentIds } });
    return res.status(200).json(comments);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/', checkLogin, async (req, res) => {
  const { _id } = req.data;
  const { content, taskId, authorName } = req.body;
  try {
    const newComment = await CommentModel.create({ content, author: _id, authorName });
    if (newComment) {
      const response = await TaskModel.updateOne({ _id: taskId }, { $push: { comments: newComment._id } });
      if (response) return res.status(200).json(newComment);
    } else return res.status(404).json();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/', checkLogin, async (req, res) => {
  const { commentId, taskId } = req.query;
  try {
    let response = await CommentModel.deleteOne({ _id: commentId });
    if (response) {
      response = await TaskModel.updateOne({ _id: taskId }, { $pull: { comments: commentId } });
      return res.status(200).json();
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put('/', checkLogin, async (req, res) => {
  const { commentId, content } = req.body;
  try {
    const response = await CommentModel.updateOne({ _id: commentId }, { content });
    if (response) return res.status(200).json();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/emoji', checkLogin, async (req, res) => {
  const { _id } = req.data;
  const { commentId, emoji } = req.body;
  try {
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const emojiList = comment.emojis[emoji];
    const hasEmojiExisted = emojiList && emojiList.length > 0 && emojiList.some((userId) => userId === _id);
    if (hasEmojiExisted) {
      comment.emojis = {
        ...comment.emojis,
        [emoji]: emojiList.filter((userId) => userId !== _id),
      };
    } else {
      comment.emojis = {
        ...comment.emojis,
        [emoji]: [...(comment.emojis[emoji] || []), _id],
      };
    }

    await comment.save();
    const result = await CommentModel.updateOne(
      { _id: commentId, [`emojis.${emoji}`]: { $size: 0 } },
      { $unset: { [`emojis.${emoji}`]: '' } },
    );
    console.log(result);
    if (result.modifiedCount > 0) {
      const newComment = await CommentModel.findById(commentId);
      return res.status(200).json(newComment);
    }
    return res.status(200).json(comment);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

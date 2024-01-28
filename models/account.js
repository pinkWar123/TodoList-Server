const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/Todo');

const accountSchema = new Schema(
  {
    username: String,
    password: String,
    name: String,
    provider: String,
    socialId: String,
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  },
  {
    collection: 'Account',
  },
);

const AccountModel = mongoose.model('account', accountSchema);

module.exports = AccountModel;

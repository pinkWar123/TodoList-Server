const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/Todo');

const accountSchema = new Schema({
    username: String,
    password: String
} , {
    collection: 'Account'
})

const AccountModel = mongoose.model('account', accountSchema);

module.exports = AccountModel;
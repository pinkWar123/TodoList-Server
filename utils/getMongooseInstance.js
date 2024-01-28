const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/Todo');

module.exports = mongoose;

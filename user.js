var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create User Schema
var User = new Schema({
  username: String,
  password: String,
  ein: {type: String, default: 000000000}
});

module.exports = mongoose.model('users', User);
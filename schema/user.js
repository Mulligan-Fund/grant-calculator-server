var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
var Schema = mongoose.Schema;
var passportLocalMongoose = require("passport-local-mongoose");

var hash_password = function(password) {
  let salt = bcrypt.genSaltSync(); // enter number of rounds, default: 10
  let hash = bcrypt.hashSync(password, salt);
  return hash;
};

// create User Schema
var User = new Schema({
  username: String,
  password: String,
  ein: { type: String, default: 000000000 },
  resetPasswordToken: String,
  resetPasswordExpires: String
});

User.plugin(passportLocalMongoose);

User.methods.comparePassword = function(password) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compareSync(password, this.password);
};

User.pre("save", function(next) {
  // check if password is present and is modified.
  if (this.password && this.isModified("password")) {
    this.password = hash_password(this.password);
  }
  next();
});

module.exports = mongoose.model("users", User);

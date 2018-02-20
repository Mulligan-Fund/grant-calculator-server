var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var grantmakerSchema = new Schema({
	grantid: Schema.Types.ObjectId,
	userid: Schema.Types.ObjectId,
});

module.exports = mongoose.model('maker', grantmakerSchema);

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var personHourSchema = new Schema({_id: Schema.Types.ObjectId, person: Schema.Types.ObjectId, hours: Number});
var orginfoSchema = new Schema({
	grantid: Schema.Types.ObjectId,
	userid: Schema.Types.ObjectId,
	username : String,
	user_role : String,
	name_of_org : String,
	ein : Number,
	yearly_rev : Number,
});

module.exports = mongoose.model('orginfo', orginfoSchema);

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var personHourSchema = new Schema({_id: Schema.Types.ObjectId, person: Schema.Types.ObjectId, hours: Number});
var orginfoSchema = new Schema({
	grantid: Schema.Types.ObjectId,
	userid: Schema.Types.ObjectId,
	firstname : String,
	lastname : String,
	user_title : String,
	grantorg : String,
	name_of_org : String,
	org_state : String,
	ein : Number,
	yearly_rev : Number,
	number_employees : Number,
	number_grants : Number,
	amount_grants : Number,
});

module.exports = mongoose.model('orginfo', orginfoSchema);

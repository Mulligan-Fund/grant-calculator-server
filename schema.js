var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var grantmakerSchema = new Schema({
	// _id: Schema.Types.ObjectId,
	userid: Schema.Types.ObjectId,
	funder : String,
	past_grant : String,
	amount : Number,
	probability : Number,
	new_or_renewal : String,
	invited_or_unsolicited : String,
	type_of_support : String,
	type_of_application : String,
	length_of_award : Number,
	number_of_questions : Number,
	site_visit : String,
	loi : String,
	number_of_reports : Number,
});

module.exports = mongoose.model('grant', grantmakerSchema);

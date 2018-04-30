var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var objectSchema = new Schema({
	// _id: Schema.Types.ObjectId,
	userid: Schema.Types.ObjectId,
	name : String,
	title : Schema.Types.ObjectId,
	salary : Number,
	delete : Boolean
});

module.exports = mongoose.model('object', objectSchema);

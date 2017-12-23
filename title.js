var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var roleSchema = new Schema({
	// _id: Schema.Types.ObjectId,
	title : String,
	salary : Number
});

module.exports = mongoose.model('role', roleSchema);

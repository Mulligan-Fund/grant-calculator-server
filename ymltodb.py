import yaml,pprint

def generateSchema(l):
	target = ""

	lines = []
	lines.append("var mongoose = require('mongoose');\n")
	lines.append("var Schema = mongoose.Schema;\n")
	lines.append("var grantmakerSchema = new Schema({\n")
	lines.append("\tgrantid: Schema.Types.ObjectId,\n")
	lines.append("\tuserid: Schema.Types.ObjectId,\n")
	

	for i in l:
		lines.append("\t"+i["field"]+" : "+i["type"]+",\n")

	lines.append("});\n\n")
	lines.append("module.exports = mongoose.model('grant', grantmakerSchema);\n")
	

	fo = open("schema.js", "w")
	fo.writelines( lines )
	fo.close()

lo = []

with open("../_data/grantseeker.yml", 'r') as stream:
    out = yaml.load(stream)

    for sect in out[0]["sections"]:
    	for quest in sect["questions"]:

    		t = "String" if quest['type'] in ["dropdown","text"] else "Number"

    		o = {"field": quest['dbfield'], "type": t}
    		lo.append(o)
    		print o
	    	# print quest['dbfield']

generateSchema(lo)





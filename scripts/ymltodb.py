import yaml,pprint

def generateGrantseekerSchema(l):
	target = ""

	lines = []
	lines.append("var mongoose = require('mongoose');\n")
	lines.append("var Schema = mongoose.Schema;\n")
	lines.append("var personHourSchema = new Schema({_id: Schema.Types.ObjectId, person: Schema.Types.ObjectId, hours: Number});\n")
	lines.append("var grantseekerSchema = new Schema({\n")
	lines.append("\tgrantid: Schema.Types.ObjectId,\n")
	lines.append("\tuserid: Schema.Types.ObjectId,\n")	
	lines.append("\ttemplate: Schema.Types.Boolean,\n")
	lines.append("\tglobaltemplate: Schema.Types.Boolean,\n")

	for i in l:
		lines.append("\t"+i["field"]+" : "+i["type"]+",\n")

	lines.append("});\n\n")
	lines.append("module.exports = mongoose.model('grant', grantseekerSchema);\n")
	

	fo = open("schema.js", "w")
	fo.writelines( lines )
	fo.close()

def generateGrantmakerSchema(l):
	target = ""

	lines = []
	lines.append("var mongoose = require('mongoose');\n")
	lines.append("var Schema = mongoose.Schema;\n")
	lines.append("var personHourSchema = new Schema({_id: Schema.Types.ObjectId, person: Schema.Types.ObjectId, hours: Number});\n")
	lines.append("var grantmakerSchema = new Schema({\n")
	lines.append("\tgrantid: Schema.Types.ObjectId,\n")
	lines.append("\tuserid: Schema.Types.ObjectId,\n")
	lines.append("\ttemplate: Schema.Types.Boolean,\n")
	lines.append("\tglobaltemplate: Schema.Types.Boolean,\n")
	
	for i in l:
		lines.append("\t"+i["field"]+" : "+i["type"]+",\n")

	lines.append("});\n\n")
	lines.append("module.exports = mongoose.model('maker', grantmakerSchema);\n")
	

	fo = open("maker.js", "w")
	fo.writelines( lines )
	fo.close()

def generateOrgInfoSchema(l):
	target = ""

	lines = []
	lines.append("var mongoose = require('mongoose');\n")
	lines.append("var Schema = mongoose.Schema;\n")
	lines.append("var personHourSchema = new Schema({_id: Schema.Types.ObjectId, person: Schema.Types.ObjectId, hours: Number});\n")
	lines.append("var orginfoSchema = new Schema({\n")
	lines.append("\tgrantid: Schema.Types.ObjectId,\n")
	lines.append("\tuserid: Schema.Types.ObjectId,\n")

	for i in l:
		lines.append("\t"+i["field"]+" : "+i["type"]+",\n")

	lines.append("});\n\n")
	lines.append("module.exports = mongoose.model('orginfo', orginfoSchema);\n")
	

	fo = open("orginfo.js", "w")
	fo.writelines( lines )
	fo.close()

lo = []
go = []
to = []

with open("../grantcalc/_data/grantseeker.yml", 'r') as stream:
    out = yaml.load(stream)

    for page in out:
	    for sect in page["sections"]:
	    	for quest in sect["questions"]:

	    		# arr = "[{_id: Schema.Types.ObjectId, person: Schema.Types.ObjectId, hours: Number}]"
	    		arr = "[personHourSchema]"

	    		t = "String" if quest['type'] in ["dropdown","text"] else "Number"
	    		t = arr if quest['type'] == "peoplelist" else t

	    		o = {"field": quest['dbfield'], "type": t}
	    		lo.append(o)
	    		print(o)
	    		# if quest['type'] == "peoplelist":
	    		# 	p = {"field": quest['dbfield']+'_hour', "type": "Number"}
	    		# 	lo.append(p)
	    		# 	print p
	    		
		    	# print quest['dbfield']
generateGrantseekerSchema(lo)

with open("../grantcalc/_data/grantmaker.yml", 'r') as stream:
    out = yaml.load(stream)
    
    for page in out:
	    for sect in page["sections"]:
	    	for quest in sect["questions"]:

	    		# arr = "[{_id: Schema.Types.ObjectId, person: Schema.Types.ObjectId, hours: Number}]"
	    		arr = "[personHourSchema]"

	    		t = "String" if quest['type'] in ["dropdown","text"] else "Number"
	    		t = arr if quest['type'] == "peoplelist" else t

	    		o = {"field": quest['dbfield'], "type": t}
	    		go.append(o)
	    		print(o)
generateGrantmakerSchema(go)


with open("../grantcalc/_data/orginfo.yml", 'r') as stream:
    out = yaml.load(stream)
    
    for page in out:
	    for sect in page["sections"]:
	    	for quest in sect["questions"]:

	    		# arr = "[{_id: Schema.Types.ObjectId, person: Schema.Types.ObjectId, hours: Number}]"
	    		arr = "[personHourSchema]"

	    		t = "String" if quest['type'] in ["dropdown","text"] else "Number"
	    		t = arr if quest['type'] == "peoplelist" else t

	    		o = {"field": quest['dbfield'], "type": t}
	    		to.append(o)
	    		print(o)
generateOrgInfoSchema(to)





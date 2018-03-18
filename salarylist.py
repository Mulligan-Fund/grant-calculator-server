import yaml,pprint

def generateGrantseekerSchema(l):
	target = ""

	lines = []
	for i in l:
		lines.append("\t"+i["field"]+" : "+i["type"]+",\n")

	lines.append("});\n\n")
	lines.append("module.exports = mongoose.model('grant', grantseekerSchema);\n")
	

	fo = open("schema.js", "w")
	fo.writelines( lines )
	fo.close()

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
	    		print o
	    		# if quest['type'] == "peoplelist":
	    		# 	p = {"field": quest['dbfield']+'_hour', "type": "Number"}
	    		# 	lo.append(p)
	    		# 	print p
	    		
		    	# print quest['dbfield']
generateGrantseekerSchema(lo)

var express = require('express')
	, connect = require('connect')
	, sessions = require('express-session')
    , morgan = require('morgan')
    , bodyParser = require('body-parser')
    , methodOverride = require('method-override')
    , app = express()
    , port = process.env.PORT || 3000
    , router = express.Router()
    , passport = require('passport')
    , LocalStrategy = require('passport-local')
    , mongoose = require('mongoose')
    , cors = require('cors');


var heroku = process.env.HEROKU_TRUE || false


var corsOrigins = ['http://127.0.0.1:4000', 'http://localhost:4000','https://mulligan-fund.github.io','https://grantcalc.herokuapp.com']
var corsSettings = cors({
	credentials: true
	, preflightContinue: true
	, allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization"
	, origin: corsOrigins
	});

app.set('view engine', 'jade');

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', heroku ? 'https://mulligan-fund.github.io' : 'http://127.0.0.1:4000');
    next();
});

app.use(morgan('dev'));  
app.use(bodyParser());
app.use(sessions({ secret: 'wowfoundations'
					 ,cookie:
					    { secure: false
					    , httpOnly: false } } ));
app.use(passport.initialize());
app.use(passport.session());
app.use(corsSettings);
app.use(methodOverride());


// Mongoose
var schema = require('./schema.js');
var maker = require('./maker.js');
var profile = require('./orginfo.js');
var User = require('./user.js');
var Obj = require('./object.js');
var Role = require('./title.js');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/grantcalc'); //process.env.MONGODB_URI || 


passport.serializeUser(function(user, done) {
	console.log("serializeUser")
	console.log(user)
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
});

var heroku = process.env.HEROKU_TRUE || false

passport.use(new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
  function(username, password, done) {
  	console.log("Looking for",username,password)
    User.findOne({ username: username.toLowerCase() }, function (err, user) {
    	console.log("Looking for user",user,err)

		if (err) { console.log(err); return done(err); }

		if (!user) { 
			console.log("Making user")
		     usr = new User({ username: username.toLowerCase(), password: password.toLowerCase() });
		     usr.save(function(err) {
			     if(err) {
			           console.log(err);
			     } else {
			           console.log('user: ' + usr.username + " saved.");
			           done(null,usr)
			     }
		  });
		}

		if(user) {
			if(user.comparePassword( password.toLowerCase() )) {
				done(null,user)
			} else {
				return done(null,false, {message: 'Invalid password'});
			}
		}
    });
  }
));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { console.log("Authenticated"); return next(); }
  else {
  	console.log("Not Authenticated");
	res.setHeader('Content-Type', 'application/json');	
	res.status(401).send(JSON.stringify("Not Logged In"))
  }
}

app.options('*', cors({
	credentials: true
	, origin: corsOrigins
	})); // Setup CORS option

app.get('/', function(req,res) {
	res.setHeader('Content-Type', 'application/json');	
	res.send(JSON.stringify("No Login"))
})

// Authenticate
app.put('/auth',
  passport.authenticate('local'),
  function(req, res) {
  	console.log("Punted through")
  	res.setHeader('Content-Type', 'application/json');	
  	res.setHeader('Content-Length', '0'); // Safari fix that seems... dubious.
	res.status(202).send(JSON.stringify("./list"))
});

// Check if authenticated
app.get('/auth', ensureAuthenticated, function(req,res,next){
	res.setHeader('Content-Type', 'application/json');	
	res.status(200).send(JSON.stringify(req.user))
});

// Main index
app.put('/', ensureAuthenticated, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');	
	res.send(JSON.stringify("Logged in"))
});

app.get('/logout',  function(req, res){
  req.logout();
  res.setHeader('Content-Type', 'application/json');	
  res.send(JSON.stringify("Logout"))
});

//////////////////////////////////
////////////// USER //////////////
//////////////////////////////////
app.get('/user', ensureAuthenticated,function(req,res,next){
	// Get User info here
	res.setHeader('Content-Type', 'application/json');	
	res.send(JSON.stringify("User info should return"))
})

app.put("/user", ensureAuthenticated,function(req,res,next){
	console.log("Updating user",req.query)
	User.findOneAndUpdate(
	{id:req.user.id}, 
		update(),
		{upsert:true}, function(err,user){
			if(err) {
				console.log("user update fail :(",err)
				res.sendStatus(500)
			} else {
				console.log("user update success",user)
				res.sendStatus(200)
			}
	})		
})



//////////////////////////////////////
/////////////  Grantseeker  ////////////////
//////////////////////////////////////


app.get('/grant/:id?', ensureAuthenticated, function(req, res, next) {
	var items = []
	User.findById(req.user._id,function(err,user){
		if(err)  {
			console.log("Some kind of error fetching user",err)
			res.sendStatus(400,err)
		}
		if(req.query.list) {
			schema.find({userid:req.user._id}, function(err,list) {
				console.log("/grant list",list)
				if(err)  {
					console.log("Some kind of error fetching grant",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(list)
			})
		} else {
			schema.findById(req.query.id,function(err,grant){
				console.log("/grant grant",grant)
				if(err)  {
					console.log("Some kind of error fetching grant",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(grant)
		    })
		}
	})
})

app.put('/grant/:id?', ensureAuthenticated, function(req,res,next) {
	var items = []
	console.log("req.user for /items",req.user)

	// Is this a new grant?	
	if(req.body._id==null) {
		console.log("Looks like a new grant")
		grant = new schema();
		grant.userid = req.user.id
		for(var i in req.body) {
			// console.log(i,typeof i)
			grant[i] = req.body[i]
		}
		grant.save(function(err,grant){
			if(err) console.log("Error creating grant",err,grant)
			res.setHeader('Content-Type', 'application/json');	
	    	res.status(200).send(grant)
		})
		
	} else {
		User.findById(req.user._id,function(err,user){
			console.log("/grant user",user)
			if(err)  {
				console.log("Some kind of error fetching pins",err)
				res.sendStatus(400,err)
			}

			if(user.username == null) {
				res.sendStatus(400,err)	
			} else {

			console.log("Attempt to insert",req.body)
			schema.findByIdAndUpdate(req.body._id ,req.body,
	          {upsert: false, new: true},
	          function(err,grant){
	           if(err) console.log("Updated form",err,grant)
	                res.setHeader('Content-Type', 'application/json');	
					res.send(JSON.stringify(grant))
	        })
			
			}
		}) 
	}
})

app.delete('/grant/:id?', ensureAuthenticated, function(req,res,next) {
	User.findById(req.user._id,function(err,user){
		console.log("DEL /grant user",user)
		if(err)  {
			console.log("Some kind of error fetching pins",err)
			res.sendStatus(400,err)
		}

		if(user.username == null) {
			res.sendStatus(400,err)	
		} else {
			console.log("Searching to DEL grant",req.body.id)
			schema.findById(req.body.id).remove( function(err,o){
	           if(err) console.log("Err Updated obj",err)
	           	console.log('DEL /object',o)
                res.setHeader('Content-Type', 'application/json');	
				res.send(o)
	        })
		}
	}) 
})



//////////////////////////////////////
/////////////  GrantMaker  ////////////////
//////////////////////////////////////


app.get('/maker/:id?', ensureAuthenticated, function(req, res, next) {
	var items = []
	User.findById(req.user._id,function(err,user){
		if(err)  {
			console.log("Some kind of error fetching user",err)
			res.sendStatus(400,err)
		}
		if(req.query.list) {
			maker.find({userid:req.user._id}, function(err,list) {
				console.log("/maker list",list)
				if(err)  {
					console.log("Some kind of error fetching maker",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(list)
			})
		} else {
			maker.findById(req.query.id,function(err,grant){
				console.log("/maker grant",grant)
				if(err)  {
					console.log("Some kind of error fetching grant",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(grant)
		    })
		}
	})
})

app.put('/maker/:id?', ensureAuthenticated, function(req,res,next) {
	var items = []
	// Is this a new grant?	
	if(req.body._id==null) {
		console.log("Looks like a new grant maker")
		grant = new maker();
		grant.userid = req.user.id
		for(var i in req.body) {
			grant[i] = req.body[i]
		}
		grant.save(function(err,grant){
			if(err) console.log("Error creating maker",err,grant)
			res.setHeader('Content-Type', 'application/json');	
	    	res.status(200).send(grant)
		})
		
	} else {
		User.findById(req.user._id,function(err,user){
			console.log("/maker user",user)
			if(err)  {
				console.log("Some kind of error fetching pins",err)
				res.sendStatus(400,err)
			}

			if(user.username == null) {
				res.sendStatus(400,err)	
			} else {

			console.log("Attempt to insert maker",req.body)
			maker.findByIdAndUpdate(req.body._id ,req.body,
	          {upsert: false, new: true},
	          function(err,grant){
	           if(err) console.log("Err Updated grantmaker",err,grant)
	                res.setHeader('Content-Type', 'application/json');	
					res.send(JSON.stringify(grant))
	        })
			
			}
		}) 
	}
})

app.delete('/maker/:id?', ensureAuthenticated, function(req,res,next) {
	User.findById(req.user._id,function(err,user){
		console.log("DEL /grant user",user)
		if(err)  {
			console.log("Some kind of error fetching pins",err)
			res.sendStatus(400,err)
		}

		if(user.username == null) {
			res.sendStatus(400,err)	
		} else {
			console.log("Searching to DEL grant",req.body.id)
			maker.findById(req.body.id).remove( function(err,o){
	           if(err) console.log("Err Updated obj",err)
	           	console.log('DEL /object',o)
                res.setHeader('Content-Type', 'application/json');	
				res.send(o)
	        })
		}
	}) 
})




//////////////////////////////////////
/////////////  Template  /////////////
//////////////////////////////////////

app.get('/template/:type', ensureAuthenticated, function(req, res, next) {
	var items = []
	User.findById(req.user._id,function(err,user){
		if(err)  {
			console.log("Some kind of error fetching user",err)
			res.sendStatus(400,err)
		}
		console.log("Template search:",req.params.type)
		// Get List of Templates
		if(req.params.type  == "maker") {
			maker.find({userid:req.user._id,template:true}, function(err,list) {
				console.log("/template/maker",list)
				if(err)  {
					console.log("Some kind of error fetching template maker",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(list)
			})
		} else if(req.params.type  == "seeker") {
			schema.find({userid:req.user._id,template:true}, function(err,list) {
				console.log("/template/seeker",list)
				if(err)  {
					console.log("Some kind of error fetching template seeker",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(list)
			})
		}
	})
})

app.get('/template/:type/:id?', ensureAuthenticated, function(req, res, next) {
	var items = []
	User.findById(req.user._id,function(err,user){
		if(err)  {
			console.log("Some kind of error fetching user",err)
			res.sendStatus(400,err)
		}
		
		// Get Individual and merge
		if(req.query.type  == "maker") {
			maker.findById(req.query.id, function(err,obj) {
				console.log("/template/maker",obj)
				if(err)  {
					console.log("Some kind of error fetching template maker",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(obj)
			})
		} else if(req.query.type  == "seeker") {
			grant.findById(req.query.id, function(err,obj) {
				console.log("/template/seeker",obj)
				if(err) {
					console.log("Some kind of error fetching template seeker",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(obj)
			})
		}
	})
})


//////////////////////////////////////
/////////////  OrgInfo  //////////////
//////////////////////////////////////


app.get('/org/:id?', ensureAuthenticated, function(req, res, next) {
	var items = []
	User.findById(req.user._id,function(err,user){
		if(err)  {
			console.log("Some kind of error fetching user",err)
			res.sendStatus(400,err)
		}
		if(req.query.list) {
			profile.find({userid:req.user._id}, function(err,list) {
				console.log("/org list",list)
				if(err)  {
					console.log("Some kind of error fetching org",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(list)
			})
		} else {
			profile.findById(req.query.id,function(err,grant){
				console.log("/org grant",grant)
				if(err)  {
					console.log("Some kind of error fetching grant",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(grant)
		    })
		}
	})
})

app.put('/org/:id?', ensureAuthenticated, function(req,res,next) {
	var items = []
	// Is this a new grant?	
	if(req.body._id==null) {
		console.log("Looks like a new orginfo")
		org = new profile();
		org.userid = req.user.id
		for(var i in req.body) {
			org[i] = req.body[i]
		}
		org.save(function(err,o){
			if(err) console.log("Error creating org",err,o)
			res.setHeader('Content-Type', 'application/json');	
	    	res.status(200).send(o)
		})
		
	} else {
		User.findById(req.user._id,function(err,user){
			console.log("/org user",user)
			if(err)  {
				console.log("Some kind of error fetching pins",err)
				res.sendStatus(400,err)
			}

			if(user.username == null) {
				res.sendStatus(400,err)	
			} else {
				console.log("Attempt to insert org",req.body)
				profile.findByIdAndUpdate(req.body._id ,req.body,
		          {upsert: true, new: true},
		          function(err,grant){
		           if(err) console.log("Err Updated orginfo",err,grant)
		                res.setHeader('Content-Type', 'application/json');	
						res.send(JSON.stringify(grant))
		        })		
			}
		}) 
	}
})

// Note, this should prob not be used
app.delete('/org/:id?', ensureAuthenticated, function(req,res,next) {
	User.findById(req.user._id,function(err,user){
		console.log("DEL /grant user",user)
		if(err)  {
			console.log("Some kind of error fetching pins",err)
			res.sendStatus(400,err)
		}

		if(user.username == null) {
			res.sendStatus(400,err)	
		} else {
			console.log("Searching to DEL grant",req.body.id)
			profile.findById(req.body.id).remove( function(err,o){
	           if(err) console.log("Err Updated obj",err)
	           	console.log('DEL /object',o)
                res.setHeader('Content-Type', 'application/json');	
				res.send(o)
	        })
		}
	}) 
})



//////////////////////////////////////
/////////////  Items  ////////////////
//////////////////////////////////////

app.get('/role/:id?', ensureAuthenticated, function(req, res, next) {
	var items = []
	Role.find({}, function(err,list) {
		if(err)  {
			console.log("Some kind of error fetching roles",err)
			res.sendStatus(400,err)
		}
		res.setHeader('Content-Type', 'application/json');	
    	res.status(200).send(list)
	})
})

app.get('/object/:id?', ensureAuthenticated, function(req, res, next) {
	var items = []
	User.findById(req.user._id,function(err,user){
		if(err)  {
			console.log("Some kind of error fetching user",err)
			res.sendStatus(400,err)
		}
		if(req.query.list) {
			console.log("for list",req.user._id)
			Obj.find({userid: req.user._id}, function(err,list) {
				console.log("/object list",list)
				if(err)  {
					console.log("Some kind of error fetching Ppl List",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(list)
			})
		} else {
			Obj.findById(req.query.id,function(err,o){
				console.log("/object object",o)
				if(err)  {
					console.log("Some kind of error fetching object",err)
					res.sendStatus(400,err)
				}
				res.setHeader('Content-Type', 'application/json');	
		    	res.status(200).send(o)
		    })
		}
	})
})

app.put('/object/:id?', ensureAuthenticated, function(req,res,next) {
	var items = []
	console.log("req.user for /object",req.user,req.body)

	// Is this a new obj?	
	if(req.body._id==null || req.body._id == 0) {
		console.log("Looks like a new object")
		object = new Obj();
		object.userid = req.user.id
		for(var i in req.body) {
			if(i !== '_id') object[i] = req.body[i]
		}
		// if(typeof object['_id'] !== 'undefined') delete object['_id']
		object.save(function(err,o){
			if(err) console.log("Error creating grant",err,o)
			res.setHeader('Content-Type', 'application/json');	
	    	res.status(200).send(o)
		})
		
	} else {
		User.findById(req.user._id,function(err,user){
			console.log("/object user",user)
			if(err)  {
				console.log("Some kind of error fetching pins",err)
				res.sendStatus(400,err)
			}

			if(user.username == null) {
				res.sendStatus(400,err)	
			} else {
				Obj.findByIdAndUpdate(req.body._id ,req.body,
		          {upsert: true, new: true},
		          function(err,o){
		           if(err) console.log("Err Updated obj",err)
		                res.setHeader('Content-Type', 'application/json');	
						res.send(JSON.stringify(o))
		        })
			}
		}) 
	}
})

app.delete('/object/:id?', ensureAuthenticated, function(req,res,next) {
		User.findById(req.user._id,function(err,user){
			console.log("DEL /object user",user)
			if(err)  {
				console.log("Some kind of error fetching pins",err)
				res.sendStatus(400,err)
			}

			if(user.username == null) {
				res.sendStatus(400,err)	
			} else {
				console.log("Searching to DEL obj",req.body.id)
				Obj.findById(req.body.id).remove( function(err,o){
		           if(err) console.log("Err Updated obj",err)
		           	console.log('DEL /object',o)
	                res.setHeader('Content-Type', 'application/json');	
					res.send(o)
		        })
			}
		}) 
})

///////////////////
/// Admin functions
///////////////////
app.get('/admin/users', ensureAuthenticated, function(req, res, next) {
	var items = []
	User.findById(req.user._id,function(err,user){
		if(err)  {
			console.log("Some kind of error fetching user",err)
			res.sendStatus(400,err)
		}
		else if(user.admin)  {
			console.log("not admin",err,user)
			res.sendStatus(401,err)
		} else {

		User.aggregate([
				{
				"$lookup": {
					"from": "profiles",
					"localField": "_id",
					"foreignField": "userid",
					"as": "user_profiles"
					}
				},
				{
				"$lookup": {
					"from": "grants",
					"localField": "_id",
					"foreignField": "userid",
					"as": "seeker"
					}
				},
				{
				"$lookup": {
					"from": "makers",
					"localField": "_id",
					"foreignField": "userid",
					"as": "maker"
					}
				}
			], function(err,list) {
			if(err)  {
				console.log("Some kind of error fetching roles",err)
				res.sendStatus(400,err)
			}
			res.setHeader('Content-Type', 'application/json');	
	    	res.status(200).send(list)
		})
		}
	})
})


app.listen(port);
console.log('App running on port', port);
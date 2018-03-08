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
var User = require('./user.js');
var Obj = require('./object.js');
var Role = require('./title.js');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/grantcalc'); //process.env.MONGODB_URI || 


// Bootstrap titles, remove this in prod
// var titles = [
//   {
//     "title": "Chief Executive Officer",
//     "salary": 134370
//   },
//   {
//     "title": "Chief Administrative Officer",
//     "salary": 107201
//   },
//   {
//     "title": "Chief Financial Officer",
//     "salary": 123636
//   },
//   {
//     "title": "Chief Information Officer",
//     "salary": 140983
//   },
//   {
//     "title": "Chief Operations Officer",
//     "salary": 122447
//   },
//   {
//     "title": "General Counselor",
//     "salary": 185247
//   },
//   {
//     "title": "Accounting Assistant",
//     "salary": 43627
//   },
//   {
//     "title": "Director; Finance",
//     "salary": 83665
//   },
//   {
//     "title": "Manager; Accounting",
//     "salary": 66698
//   },
//   {
//     "title": "Payroll Assistant",
//     "salary": 41027
//   },
//   {
//     "title": "Staff Accountant",
//     "salary": 53633
//   },
//   {
//     "title": "Vice President; Finance",
//     "salary": 112935
//   },
//   {
//     "title": "Administrative Assistant",
//     "salary": 36145
//   },
//   {
//     "title": "Administrative Secretary",
//     "salary": 43181
//   },
//   {
//     "title": "Director; Administration",
//     "salary": 54201
//   },
//   {
//     "title": "Executive Secretary",
//     "salary": 50915
//   },
//   {
//     "title": "Member Services Representative",
//     "salary": 36688
//   },
//   {
//     "title": "Office Assistant",
//     "salary": 30809
//   },
//   {
//     "title": "Office Manager",
//     "salary": 40193
//   },
//   {
//     "title": "Receptionist",
//     "salary": 28966
//   },
//   {
//     "title": "Secretary",
//     "salary": 30336
//   },
//   {
//     "title": "Director; Communications",
//     "salary": 76640
//   },
//   {
//     "title": "Director; Marketing",
//     "salary": 81239
//   },
//   {
//     "title": "Manager; Marketing",
//     "salary": 62646
//   },
//   {
//     "title": "Manager; Public Relations",
//     "salary": 57285
//   },
//   {
//     "title": "Vice President; Communications",
//     "salary": 133126
//   },
//   {
//     "title": "Web & Social Media Director",
//     "salary": 55530
//   },
//   {
//     "title": "Director; Government Relations",
//     "salary": 124862
//   },
//   {
//     "title": "Public Policy Analyst",
//     "salary": 81888
//   },
//   {
//     "title": "Staff Attorney",
//     "salary": 68994
//   },
//   {
//     "title": "Vice President; Government Relations",
//     "salary": 201816
//   },
//   {
//     "title": "Director; Human Resources",
//     "salary": 83481
//   },
//   {
//     "title": "Human Resources Assistant",
//     "salary": 38318
//   },
//   {
//     "title": "Manager; Human Resources",
//     "salary": 65405
//   },
//   {
//     "title": "Vice President; Human Resources",
//     "salary": 135332
//   },
//   {
//     "title": "Case Manager",
//     "salary": 36880
//   },
//   {
//     "title": "Counselor",
//     "salary": 35709
//   },
//   {
//     "title": "Social Worker",
//     "salary": 50324
//   },
//   {
//     "title": "Trainer",
//     "salary": 46351
//   },
//   {
//     "title": "Director; Information Technology",
//     "salary": 104475
//   },
//   {
//     "title": "Systems Analyst",
//     "salary": 69356
//   },
//   {
//     "title": "Web Developer",
//     "salary": 76152
//   },
//   {
//     "title": "Director; Convention/Meetings",
//     "salary": 98032
//   },
//   {
//     "title": "Manager; Convention/Meetings",
//     "salary": 63222
//   },
//   {
//     "title": "Development Associate",
//     "salary": 41877
//   },
//   {
//     "title": "Director; Development/Fundraising",
//     "salary": 72179
//   },
//   {
//     "title": "Director; Membership",
//     "salary": 81212
//   },
//   {
//     "title": "Grant Writer",
//     "salary": 49859
//   },
//   {
//     "title": "Manager; Development/Fundraising",
//     "salary": 61816
//   },
//   {
//     "title": "Program Assistant",
//     "salary": 35274
//   },
//   {
//     "title": "Program Coordinator",
//     "salary": 41466
//   },
//   {
//     "title": "Program Director",
//     "salary": 65855
//   },
//   {
//     "title": "Program Manager",
//     "salary": 58184
//   },
//   {
//     "title": "Vice President; Development/Fundraising",
//     "salary": 126684
//   },
//   {
//     "title": "Vice President; Membership",
//     "salary": 136840
//   },
//   {
//     "title": "Volunteer Coordinator",
//     "salary": 38333
//   },
//   {
//     "title": "Director; Education",
//     "salary": 87045
//   },
//   {
//     "title": "Director; Research",
//     "salary": 87733
//   },
//   {
//     "title": "Manager; Education",
//     "salary": 64785
//   },
//   {
//     "title": "Research Assistant",
//     "salary": 51005
//   },
//   {
//     "title": "Research Associate",
//     "salary": 54909
//   },
//   {
//     "title": "Research Fellow",
//     "salary": 113688
//   },
//   {
//     "title": "Senior Research Fellow",
//     "salary": 145860
//   }
// ]

// for(var i in titles) {
// 	var gg = new Role(titles[i])
// 	gg.save()
// }

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



app.listen(port);
console.log('App running on port', port);
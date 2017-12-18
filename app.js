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
app.use(cors({
	credentials: true
	, preflightContinue: true
	, allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept"
	, origin: ['http://127.0.0.1:4000','https://mulligan-fund.github.io/']
	}));
app.use(methodOverride());

// Mongoose
var schema = require('./schema.js');
var User = require('./user.js');
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
    User.findOne({ username: username }, function (err, user) {
    	console.log("Looking for user",user,err)
		if (err) { console.log(err); return done(err); }

		if (!user) { 
			console.log("Making user")
		     usr = new User({ username: username, password: password });
		     usr.save(function(err) {
			     if(err) {
			           console.log(err);
			     } else {
			           console.log('user: ' + usr.username + " saved.");
			           done(null,user)
			     }
		  });

		}

		if(user) {
			if(user.comparePassword( password )) {
				done(null,user)
			} else {
				return done(null,false, {message: 'Invalid password'});
			}
		}



		// TO IMPLEMENT
		// bcrypt.compare(pw, this.password, function(err, isMatch) {
		//   if (err) return done(err);
		//   if(isMatch) {
		//     return done(null, user);
		//   } else {
		//     return done(null, false, { message: 'Invalid password' });
		//   }
		// });

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

// // Default return

// function `ware() { 
//   return function (req, res, next) {
//     if (req.isAuthenticated()) {
//       return next()
//     } else {
// 		res.status(401).send(JSON.stringify("Not Logged In"))
// 	}
//   }
// }

app.options('*', cors({credentials: true, origin: ['http://127.0.0.1:4000','https://mulligan-fund.github.io']})); // Setup CORS option



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

app.get('/login',  function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');	
	res.send(JSON.stringify("Error login"))
});


app.get('/logout',  function(req, res){
  req.logout();
  res.setHeader('Content-Type', 'application/json');	
  res.send(JSON.stringify("Error login"))
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
/////////////  Items  ////////////////
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
			console.log("Returned user",user)
			console.log("To insert",req.body)

			schema.findByIdAndUpdate(req.body._id ,req.body,
	          {upsert: false, new: true},
	          function(err,grant){
	           if(err) console.log("Updated form")
	                res.setHeader('Content-Type', 'application/json');	
					res.send(JSON.stringify(grant))
	        })
			
			}
		}) 
	}
})

app.listen(port);
console.log('App running on port', port);
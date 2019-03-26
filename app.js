var express = require("express"),
  connect = require("connect"),
  crypto = require("crypto"),
  moment = require("moment"),
  sessions = require("express-session"),
  morgan = require("morgan"),
  bodyParser = require("body-parser"),
  methodOverride = require("method-override"),
  app = express(),
  port = process.env.PORT || 3000,
  router = express.Router(),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  mongoose = require("mongoose"),
  passportLocalMongoose = require("passport-local-mongoose"),
  postmark = require("postmark"),
  cors = require("cors");

var postmarkClient = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

var heroku = process.env.HEROKU_TRUE || false;

var corsOrigins = [
  "http://127.0.0.1:4000",
  "http://localhost:4000",
  "https://netgrant.org",
  "https://mulligan-fund.github.io",
  "https://grantcalc.herokuapp.com"
];
var corsSettings = cors({
  credentials: true,
  preflightContinue: true,
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  origin: corsOrigins
});

app.set("view engine", "jade");
app.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Origin",
    heroku ? "https://netgrant.org" : "http://127.0.0.1:4000"
  );
  next();
});

app.use(morgan("dev"));
app.use(bodyParser());
app.use(
  sessions({
    secret: "wowfoundations",
    cookie: { secure: false, httpOnly: false }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(corsSettings);
app.use(methodOverride());

// Mongoose
var schema = require("./schema/schema.js");
var maker = require("./schema/maker.js");
var profile = require("./schema/orginfo.js");
var User = require("./schema/user.js");
var Obj = require("./schema/object.js");
var Role = require("./schema/title.js");
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/grantcalc"); //process.env.MONGODB_URI ||

var bs = require("./helpers/bootstrap.js"); // Bootstraps database
bs.init(mongoose, Role, Obj);

passport.serializeUser(function(user, done) {
  console.log("serializeUser");
  console.log(user);
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

var heroku = process.env.HEROKU_TRUE || false;

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password"
    },
    function(username, password, done) {
      console.log("Looking for", username, password);
      User.findOne({ username: username.toLowerCase() }, function(err, user) {
        console.log("Looking for user", user, err);

        if (err) {
          console.log(err);
          return done(err);
        }

        if (!user) {
          console.log("Making user");
          usr = new User({
            username: username.toLowerCase(),
            password: password.toLowerCase()
          });
          usr.save(function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("user: " + usr.username + " saved.");
              done(null, usr);
            }
          });
        }

        if (user) {
          if (user.comparePassword(password.toLowerCase())) {
            done(null, user);
          } else {
            return done(null, false, {
              message: "Invalid password"
            });
          }
        }
      });
    }
  )
);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("Authenticated");
    return next();
  } else {
    console.log("Not Authenticated");
    res.setHeader("Content-Type", "application/json");
    res.status(401).send(JSON.stringify("Not Logged In"));
  }
}

function sendEmail(email, link, cb) {
  const msg = {
    to: email,
    from: "no-reply@netgrant.org",
    subject: "Forgot your password?",
    text:
      "Hey, did you forget your password? Click this link to reset it: " + link,
    html:
      '<strong>Hey guys</strong><br><p>Hey, did you forgot your password? Click this link to reset it</p><br><a href="' +
      link +
      '">Click this link</a>'
  };

  postmarkClient.sendEmail(
    {
      From: "info@stupidsystems.com",
      To: msg.to,
      Subject: msg.subject,
      TextBody: msg.text
    },
    cb
  );
}

app.options(
  "*",
  cors({
    credentials: true,
    origin: corsOrigins
  })
); // Setup CORS option

app.get("/", function(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify("No Login"));
});

// Authenticate
app.put("/auth", passport.authenticate("local"), function(req, res) {
  console.log("Punted through");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", "0"); // Safari fix that seems... dubious.
  res.status(202).send(JSON.stringify("./list"));
});

// Check if authenticated
app.get("/auth", ensureAuthenticated, function(req, res, next) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(req.user));
});

// Main index
app.put("/", ensureAuthenticated, function(req, res, next) {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify("Logged in"));
});

app.get("/logout", function(req, res) {
  req.logout();
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify("Logout"));
});

// Get Reset token
app.post("/forgot/:username", async function(req, res, next) {
  console.log("Running Forgot", req.params.username);
  try {
    var buf = await crypto.randomBytes(20);
    var token = buf.toString("hex");
    var username = req.params.username;
    var user = await User.findOneAndUpdate(
      { username },
      {
        resetPasswordToken: token,
        resetPasswordExpires: moment()
          .add(1, "hour")
          .toDate()
      }
    );
    if (!user) {
      console.log("No such user");
    }
    var pathToToken =
      String(
        heroku
          ? "https://netgrant.org"
          : "http://127.0.0.1:4000/grant-calculator"
      ) +
      "/reset?token=" +
      token;
    sendEmail(username, pathToToken, function(err, status) {
      if (err) res.status(500).json("error:" + err);
      else res.status(200).json(pathToToken);
    });
  } catch (error) {
    console.error(error);
    // handleError(res, error.message, "/forgot");
  }
});

// Reset the actual thing
app.post("/reset/:token", async function(req, res, next) {
  console.log("Running Reset", req.params.token, req.query.password);
  try {
    var resetPasswordToken = req.params.token;
    var password = req.query.password;
    var user = await User.findOneAndUpdate(
      {
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      },
      {
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      }
    );
    // if (!user) {
    // 	res.status(400).json("No user");
    // 	return;
    // }
    console.log("Found user to reset", user);
    // user.setPassword(password, (error, user) => {
    // 	if (error) {
    // 		return next(error);
    // 	}
    // user.password =
    user.set({
      password: password.toLowerCase()
    });
    user.markModified("password");
    user.save((err, user) => {
      if (err) {
        return next(error);
      } else {
        res.status(200).json("Reset password " + user.username);
      }
      // passport.authenticate("local", function(error, user, info) {
      // 	console.log("error", error);
      // 	console.log("user", user);
      // 	console.log("info", info);
      // 	if (error) {
      // 		return next(error);
      // 	}
      // 	if (!user) {
      // 		return next("No user");
      // 	}
      // 	req.logIn(user, function(error) {
      // 		if (error) {
      // 			return next(error);
      // 		}
      // 		return res.redirect("/");
      // 	});
      // })(req, res, next);
    });
    // });
  } catch (error) {
    console.log(error);
    res.status(500).json("failure " + error);
    // handleError(res, error.message, "/reset");
  }
});

//////////////////////////////////
////////////// USER //////////////
//////////////////////////////////
app.get("/user", ensureAuthenticated, function(req, res, next) {
  // Get User info here
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify("User info should return"));
});

app.put("/user", ensureAuthenticated, function(req, res, next) {
  console.log("Updating user", req.query);
  User.findOneAndUpdate(
    { id: req.user.id },
    update(),
    { upsert: true },
    function(err, user) {
      if (err) {
        console.log("user update fail :(", err);
        res.sendStatus(500);
      } else {
        console.log("user update success", user);
        res.sendStatus(200);
      }
    }
  );
});

//////////////////////////////////////
/////////////  Grants  ////////////////
//////////////////////////////////////

app.get("/g/:type/:id?", ensureAuthenticated, function(req, res, next) {
  var items = [];
  var model = {};
  if (req.params.type == "maker") {
    model = maker;
  } else {
    model = schema;
  }
  User.findById(req.user._id, function(err, user) {
    if (err) {
      console.log("Some kind of error fetching user", err);
      res.sendStatus(400, err);
    }
    if (req.query.list) {
      model.find({ userid: req.user._id }, function(err, list) {
        console.log("/maker list", list);
        if (err) {
          console.log("Some kind of error fetching maker", err);
          res.sendStatus(400, err);
        }
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(list);
      });
    } else {
      model.findById(req.query.id, function(err, grant) {
        console.log("/maker grant", grant);
        if (err) {
          console.log("Some kind of error fetching grant", err);
          res.sendStatus(400, err);
        }
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(grant);
      });
    }
  });
});

app.put("/g/:type/:id?", ensureAuthenticated, function(req, res, next) {
  var items = [];
  var model = {};
  if (req.params.type == "maker") {
    model = maker;
  } else {
    model = schema;
  }
  // Is this a new grant?
  if (req.body._id == null) {
    console.log("Looks like a new grant maker");
    grant = new model();
    grant.userid = req.user.id;
    for (var i in req.body) {
      grant[i] = req.body[i];
    }
    grant.save(function(err, grant) {
      if (err) console.log("Error creating maker", err, grant);
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(grant);
    });
  } else {
    User.findById(req.user._id, function(err, user) {
      console.log("/maker user", user);
      if (err) {
        console.log("Some kind of error fetching pins", err);
        res.sendStatus(400, err);
      }

      if (user.username == null) {
        res.sendStatus(400, err);
      } else {
        console.log("Attempt to insert", req.body);
        model.findById(req.body._id, { lean: true }, function(err, grant) {
          if (err) console.log("Updated form", err, grant);
          grant.set(req.body);
          for (var i = 0; i < grant.length; i++) {
            console.log("mod", grant[i].isArray(), grant[i].key);
            if (grant[i].isArray()) grant.markModified(grant[i].key);
          }
          grant.save(function() {
            res.setHeader("Content-Type", "application/json");
            res.send(JSON.stringify(grant));
          });
        });
      }
    });
  }
});

app.delete("/g/:type/:id?", ensureAuthenticated, function(req, res, next) {
  var model = {};
  if (req.params.type == "maker") {
    model = maker;
  } else {
    model = schema;
  }
  User.findById(req.user._id, function(err, user) {
    console.log("DEL /grant user", user);
    if (err) {
      console.log("Some kind of error fetching pins", err);
      res.sendStatus(400, err);
    }

    if (user.username == null) {
      res.sendStatus(400, err);
    } else {
      console.log("Searching to DEL grant", req.body.id);
      model.findById(req.body.id).remove(function(err, o) {
        if (err) console.log("Err Updated obj", err);
        console.log("DEL /object", o);
        res.setHeader("Content-Type", "application/json");
        res.send(o);
      });
    }
  });
});

//////////////////////////////////////
/////////////  Template  /////////////
//////////////////////////////////////

app.get("/template/:type", ensureAuthenticated, function(req, res, next) {
  var items = [];
  var model = {};
  if (req.params.type == "maker") {
    model = maker;
  } else {
    model = schema;
  }
  User.findById(req.user._id, function(err, user) {
    if (err) {
      console.log("Some kind of error fetching user", err);
      res.sendStatus(400, err);
    }
    console.log("Template search:", req.params.type);
    // Fetch local
    model.find({ userid: req.user._id, template: true }, function(err, list) {
      //also fetch global
      model.find({ globaltemplate: true }, function(err, globallist) {
        console.log("/template/maker/user", list);
        console.log("/template/maker/global", globallist);
        if (err) {
          console.log("Some kind of error fetching templates", err);
          res.sendStatus(400, err);
        }
        returnArray = [...list, ...globallist];
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(returnArray);
      });
    });
  });
});

app.get("/template/:type/:id?", ensureAuthenticated, function(req, res, next) {
  var model = {};
  if (req.params.type == "maker") {
    model = maker;
  } else {
    model = schema;
  }
  var items = [];
  User.findById(req.user._id, function(err, user) {
    if (err) {
      console.log("Some kind of error fetching user", err);
      res.sendStatus(400, err);
    }

    // Get Individual and merge
    if (req.query.type == "maker") {
      model.findById(req.query.id, function(err, obj) {
        console.log("/template/maker", obj);
        if (err) {
          console.log("Some kind of error fetching template maker", err);
          res.sendStatus(400, err);
        }
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(obj);
      });
    }
  });
});

//////////////////////////////////////
/////////////  OrgInfo  //////////////
//////////////////////////////////////

app.get("/org/:id?", ensureAuthenticated, function(req, res, next) {
  var items = [];
  User.findById(req.user._id, function(err, user) {
    if (err) {
      console.log("Some kind of error fetching user", err);
      res.sendStatus(400, err);
    }
    if (req.query.list) {
      profile.find({ userid: req.user._id }, function(err, list) {
        console.log("/org list", list);
        if (err) {
          console.log("Some kind of error fetching org", err);
          res.sendStatus(400, err);
        }
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(list);
      });
    } else {
      profile.findById(req.query.id, function(err, grant) {
        console.log("/org grant", grant);
        if (err) {
          console.log("Some kind of error fetching grant", err);
          res.sendStatus(400, err);
        }
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(grant);
      });
    }
  });
});

app.put("/org/:id?", ensureAuthenticated, function(req, res, next) {
  var items = [];
  // Is this a new grant?
  if (req.body._id == null) {
    console.log("Looks like a new orginfo");
    org = new profile();
    org.userid = req.user.id;
    for (var i in req.body) {
      org[i] = req.body[i];
    }
    org.save(function(err, o) {
      if (err) console.log("Error creating org", err, o);
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(o);
    });
  } else {
    User.findById(req.user._id, function(err, user) {
      console.log("/org user", user);
      if (err) {
        console.log("Some kind of error fetching pins", err);
        res.sendStatus(400, err);
      }

      if (user.username == null) {
        res.sendStatus(400, err);
      } else {
        console.log("Attempt to insert org", req.body);
        profile.findByIdAndUpdate(
          req.body._id,
          req.body,
          { upsert: true, new: true },
          function(err, grant) {
            if (err) console.log("Err Updated orginfo", err, grant);
            res.setHeader("Content-Type", "application/json");
            res.send(JSON.stringify(grant));
          }
        );
      }
    });
  }
});

// Note, this should prob not be used
app.delete("/org/:id?", ensureAuthenticated, function(req, res, next) {
  User.findById(req.user._id, function(err, user) {
    console.log("DEL /grant user", user);
    if (err) {
      console.log("Some kind of error fetching pins", err);
      res.sendStatus(400, err);
    }

    if (user.username == null) {
      res.sendStatus(400, err);
    } else {
      console.log("Searching to DEL grant", req.body.id);
      profile.findById(req.body.id).remove(function(err, o) {
        if (err) console.log("Err Updated obj", err);
        console.log("DEL /object", o);
        res.setHeader("Content-Type", "application/json");
        res.send(o);
      });
    }
  });
});

//////////////////////////////////////
/////////////  Items  ////////////////
//////////////////////////////////////

app.get("/role/:id?", ensureAuthenticated, function(req, res, next) {
  var items = [];
  Role.find({}, function(err, list) {
    if (err) {
      console.log("Some kind of error fetching roles", err);
      res.sendStatus(400, err);
    }
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(list);
  });
});

app.get("/object/:id?", ensureAuthenticated, function(req, res, next) {
  var items = [];
  User.findById(req.user._id, function(err, user) {
    if (err) {
      console.log("Some kind of error fetching user", err);
      res.sendStatus(400, err);
    }
    if (req.query.list && req.query.global) {
      console.log("for list", req.user._id);
      // Obj.find({ userid: req.user._id }, function(err, list) { // Old call just in case
      Obj.find({ $or: [{ userid: req.user._id }, { global: true }] })
        .sort({
          global: -1 // Hopefully sorts?
        })
        .exec(function(err, list) {
          console.log("/object list", list);
          if (err) {
            console.log("Some kind of error fetching Ppl List", err);
            res.sendStatus(400, err);
          }
          res.setHeader("Content-Type", "application/json");
          res.status(200).send(list);
        });
    } else if (req.query.list) {
      console.log("for list", req.user._id);
      // Obj.find({ userid: req.user._id }, function(err, list) { // Old call just in case
      Obj.find({ userid: req.user._id })
        .sort({
          global: -1 // Hopefully sorts?
        })
        .exec(function(err, list) {
          console.log("/object list", list);
          if (err) {
            console.log("Some kind of error fetching Ppl List", err);
            res.sendStatus(400, err);
          }
          res.setHeader("Content-Type", "application/json");
          res.status(200).send(list);
        });
    } else {
      Obj.findById(req.query.id, function(err, o) {
        console.log("/object object", o);
        if (err) {
          console.log("Some kind of error fetching object", err);
          res.sendStatus(400, err);
        }
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(o);
      });
    }
  });
});

app.put("/object/:id?", ensureAuthenticated, function(req, res, next) {
  var items = [];
  console.log("req.user for /object", req.user, req.body);

  // Is this a new obj?
  if (req.body._id == null || req.body._id == 0) {
    console.log("Looks like a new object");
    object = new Obj();
    object.userid = req.user.id;
    for (var i in req.body) {
      if (i !== "_id") object[i] = req.body[i];
    }
    // if(typeof object['_id'] !== 'undefined') delete object['_id']
    object.save(function(err, o) {
      if (err) console.log("Error creating grant", err, o);
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(o);
    });
  } else {
    User.findById(req.user._id, function(err, user) {
      console.log("/object user", user);
      if (err) {
        console.log("Some kind of error fetching pins", err);
        res.sendStatus(400, err);
      }

      if (user.username == null) {
        res.sendStatus(400, err);
      } else {
        Obj.findByIdAndUpdate(
          req.body._id,
          req.body,
          { upsert: true, new: true },
          function(err, o) {
            if (err) console.log("Err Updated obj", err);
            res.setHeader("Content-Type", "application/json");
            res.send(JSON.stringify(o));
          }
        );
      }
    });
  }
});

app.delete("/object/:id?", ensureAuthenticated, function(req, res, next) {
  User.findById(req.user._id, function(err, user) {
    console.log("DEL /object user", user);
    if (err) {
      console.log("Some kind of error fetching pins", err);
      res.sendStatus(400, err);
    }

    if (user.username == null) {
      res.sendStatus(400, err);
    } else {
      console.log("Searching to DEL obj", req.body.id);
      Obj.findById(req.body.id).remove(function(err, o) {
        if (err) console.log("Err Updated obj", err);
        console.log("DEL /object", o);
        res.setHeader("Content-Type", "application/json");
        res.send(o);
      });
    }
  });
});

///////////////////
/// Admin functions
///////////////////
app.get("/admin/users", ensureAuthenticated, function(req, res, next) {
  var items = [];
  User.findById(req.user._id, function(err, user) {
    if (err) {
      console.log("Some kind of error fetching user", err);
      res.sendStatus(400, err);
    } else if (user.admin) {
      console.log("not admin", err, user);
      res.sendStatus(401, err);
    } else {
      User.aggregate(
        [
          {
            $lookup: {
              from: "profiles",
              localField: "_id",
              foreignField: "userid",
              as: "user_profiles"
            }
          },
          {
            $lookup: {
              from: "grants",
              localField: "_id",
              foreignField: "userid",
              as: "seeker"
            }
          },
          {
            $lookup: {
              from: "makers",
              localField: "_id",
              foreignField: "userid",
              as: "maker"
            }
          }
        ],
        function(err, list) {
          if (err) {
            console.log("Some kind of error fetching roles", err);
            res.sendStatus(400, err);
          }
          res.setHeader("Content-Type", "application/json");
          res.status(200).send(list);
        }
      );
    }
  });
});

app.listen(port);
console.log("App running on port", port);

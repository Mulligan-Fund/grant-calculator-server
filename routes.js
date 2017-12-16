var express = require('express');
var http = require('http');
var request = require('request');
var router = express.Router();
var auth = require('../services/auth.js')
var passport = require('../services/auth.js').passport
var strava = require('../services/strava.js')
  , log = require('../services/log.js')
var pinterest = require('../services/pinterest.js')



router.get('/api', 
  passport.authenticate('strava',
  	{ failureRedirect: '/login' }),
  function(req, res) {

});


var db = {
  update: function(update,response) {
    db.find({
          kitid: kitid
          },function(err,products){
            if(err) console.log("err getting kit content",err)
            db.item.find({
              userid: userid
            }, function(err,items){
              kitService.fetchAndMergeItems(userid,kitid,function(err,it){
                return(callback(err,it))
              })
            })
        })
  }
}



module.exports = router;

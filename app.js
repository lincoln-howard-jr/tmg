var express = require('express');
var app = express ();
let mongoose = require ('mongoose');
let getEnv = require ('./getEnv');
let sessions = require ('./config/sessions');
global.passport = require ('passport');
// body parser imports
let bgs = require ('./config/bgs');
let {json, urlencoded} = require ('body-parser');

let connected = false;

const connectToDb = async (req, res, next) => {
  try {
    if (connected) return next ();
    let dbUri = await getEnv ('dbUri');
    req.dbUri = dbUri;
    mongoose.connect (dbUri, err => {
      if (err) return res.status (500).json ({err});
      connected = true;
      return next ();
    }, { useNewUrlParser: true });
  } catch (e) {
    return res.status (500).json ({reason: 'could not connect to database', e});
  }
}
app.use (connectToDb);
app.use (sessions);
app.use (bgs ());
app.use (json ());
app.use (urlencoded ({extended: true}));
// import and use controllers
'UserController.js'.split (' ').forEach (controller => {
  app.use ('/api', require ('./controllers/' + controller))
});
// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
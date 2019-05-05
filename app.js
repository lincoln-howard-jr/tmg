var express = require('express');
var app = express ();
let mongoose = require ('mongoose');
let getEnv = require ('./getEnv');
let sessions = require ('./config/sessions');
global.passport = require ('passport');
// body parser imports
let bgs = require ('./config/bgs');
let {json, urlencoded} = require ('body-parser');

const logger = (req, res, next) => {
  let r = `${req.method.toUpperCase ()} ${req.path}`;
  let b = !req.body ? '' : ('body: ' + JSON.stringify (req.body, null, 2));
  let u = !req.user ? 'no user logged in' : `username=${req.user.username}`;
  console.log (`
    ${r}
    ${b}
    ${u}
  `);
  next ();
}

let connected = false;

const connectToDb = async (req, res, next) => {
  console.log ('connecting to db');
  try {
    if (connected) return next ();
    let dbUri = await getEnv ('dbUri');
    req.dbUri = dbUri;
    mongoose.connect (dbUri, err => {
      console.log (err);
      if (err) return res.status (500).json ({err});
      connected = true;
      console.log ('connection successful');
      return next ();
    }, { useNewUrlParser: true });
  } catch (e) {
    console.log (e);
    return res.status (500).json ({reason: 'could not connect to database', e});
  }
}

const enableCors = (req, res, next) => {
  res.set ('Access-Control-Allow-Origin', 'https://dflag8enurd16.cloudfront.net');
  res.set ('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
  res.set ('Access-Control-Allow-Headers', '*')
  res.set ('ACcess-Control-Allow-Credentials', true)
  next ();
}

app.options ('*', enableCors, (req, res) => {
  res.status (200).json ({options: true});
})

app.use (enableCors);
app.use (connectToDb);
app.use (sessions);
app.use (bgs ());
app.use (json ());
app.use (urlencoded ({extended: true}));
// import and use controllers
'UserController.js ForumController.js'.split (' ').forEach (controller => {
  app.use ('/api', require ('./controllers/' + controller))
});
// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
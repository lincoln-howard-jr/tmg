var express = require('express');
var app = express ();
let mongoose = require ('mongoose');
const AWS = require ('aws-sdk');
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

let updated = false;

// update aws config
const updateAWSConfig = async (req, res, next) => {

  if (updated) return next ();

  let secretAccessKey = await getEnv ('aws_secret_access_key');
  let accessKeyId = await getEnv ('aws_access_key_id');

  AWS.config.update({
    secretAccessKey,
    accessKeyId,
    region: 'us-east-1'
  });

  next ();
  updated = true;

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

const whitelist = ['https://www.themetropolitanglobal.com', 'https://www.metropolitanglobal.com'];
const cors = (req, res, next) => {
  if (whitelist.indexOf (req.headers.origin) === -1) return res.status (403).json ({reason: 'CORS not enabled'});
  res.set ('Access-Control-Allow-Origin', req.headers.origin);
  res.set ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set ('Access-Control-Allow-Headers', 'content-type, origin, accept');
  res.set ('Access-Control-Allow-Credentials', true);
  next ();
}

app.options ('*', cors, (req, res) => {
  res.json ({cors: true});
});

app.use (cors);
app.use (updateAWSConfig)
app.use (connectToDb);
app.use (sessions);
app.use (json ());
app.use (urlencoded ({extended: true}));
// import and use controllers
'ElectionController.js UserController.js ForumController.js PaymentController.js ArticleController.js'.split (' ').forEach (controller => {
  app.use ('/api', require ('./controllers/' + controller))
});
// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
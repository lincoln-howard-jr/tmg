var express = require('express');
var app = express ();
let decryptEnv = require ('./config/decryptEnv');
let mongoose = require ('mongoose');
(async (env) => {
  try {
    let connectionString = await decryptEnv (env)
    mongoose.connect (connectionString, (err) => {
      console.log (err);
    });
  } catch (e) {
    console.log (e);
  }
})// ('MONGODB_URI');
(async () => {
  try {
    let mongodbUri = await decryptEnv ('MONGODB_URI');
    app.get ('/', (req, res) => {
      res.json ({mongodbUri});
    })
  } catch (e) {
    app.get ('/', (req, res) => {
      res.json ({e});
    });
  }
}) ();

app.post('/', function(req, res) {
  res.json ({
    "Output": "Hello World!"
  });
});


// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
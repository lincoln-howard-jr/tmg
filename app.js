var express = require('express');
var app = express ();
let mongoose = require ('mongoose');
let getEnv = require ('./getEnv');
(async () => {
  try {
    let mongodbUri = await getEnv ('dbUri');
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
var express = require('express');
var app = express ();
let mongoose = require ('mongoose');
let getEnv = require ('./getEnv');

const connectToDb = async (dbUri) => {
  return new Promise ((resolve, reject) => {
    mongoose.connect (dbUri, err => {
      if (err) return reject (err);
      resolve ();
    })
  });
}

(async () => {
  try {
    let dbUri = await getEnv ('dbUri');
    await connectToDb (dbUri);
    app.get ('/', (req, res) => {
      res.json ('db connected successfully');
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
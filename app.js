var express = require('express');
var app = express();
const aws = require ('aws-sdk');
let kms = new aws.KMS ();

const decryptEnv = (env) => {
  return new Promise ((resolve, reject) => {
    kms.decrypt ({CiphertextBlob: new Buffer (process.env [env], 'base64')}, (err, data) => {
      if (err) return reject (err);
      resolve (data);
    });
  });
}

app.get('/', async (req, res) => {
  res.send({
    uri: await decryptEnv ('MONGODB_URI')
  });
});

app.post('/', function(req, res) {
  res.send({
    "Output": "Hello World!"
  });
});


// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
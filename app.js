var express = require('express');
var app = express();
const aws = require ('aws-sdk');
let kms = new aws.KMS ({region: 'us-east-1'});

const decryptEnv = (env) => {
  return new Promise ((resolve, reject) => {
    kms.decrypt ({CiphertextBlob: new Buffer (process.env [env])}, (err, data) => {
      console.log (err, data);
      if (err) return reject (err);
      resolve (data.Plaintext.toString ());
    });
  });
}

app.get('/', async (req, res) => {
  try {
    res.send({
      uri: await decryptEnv ('MONGODB_URI')
    });
  } catch (e) {
    res.send ({e});
  }
});

app.post('/', function(req, res) {
  res.send({
    "Output": "Hello World!"
  });
});


// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
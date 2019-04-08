const aws = require ('aws-sdk');
let kms = new aws.KMS ({region: 'us-east-1'});

const decryptEnv = (env) => {
  return new Promise ((resolve, reject) => {
    kms.decrypt ({CiphertextBlob: new Buffer (process.env [env], 'base64')}, (err, data) => {
      console.log (err, data);
      if (err) return reject (err);
      resolve (data.Plaintext.toString ());
    });
  });
}

module.exports = decryptEnv;
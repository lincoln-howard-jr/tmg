const aws = require ('aws-sdk');
const kms = new aws.KMS ({region: 'us-east-1'});
const env = require ('./env.json');
module.exports = (name) => {
  return new Promise (async (resolve, reject) => {
    try {
      if (!env [name]) throw `env ${name} dne`;
      let decrypted = await kms.decrypt ({CiphertextBlob: Buffer (env [name], 'base64')}).promise ();
      resolve (decrypted.Plaintext.toString ());
    } catch (e) {
      console.log (e)
      reject (e);
    }
  });
};
const fs = require ('fs')
const aws = require ('aws-sdk');
let env = require ('./env.json');
let kms = new aws.KMS ({region: 'us-east-1'});
let KeyId = 'arn:aws:kms:us-east-1:687285989071:key/922abe4d-29a7-46e4-89f7-31286260d4f3';
let Plaintext = '<string to encrypt>';

(async () => {
  let response = await kms.encrypt ({KeyId, Plaintext}).promise ();
  let data = response.CiphertextBlob.toString ('base64');
  console.log (data);
  env.dbUri = data;
  fs.writeFile ('env.json', JSON.stringify (env));
  let decryptResponse = await kms.decrypt ({CiphertextBlob: Buffer (data, 'base64')}).promise ();
  console.log (decryptResponse.Plaintext.toString ());
}) ();



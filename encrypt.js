const fs = require ('fs')
const aws = require ('aws-sdk');
let env = require ('./env.json');
let kms = new aws.KMS ({region: 'us-east-1'});
let KeyId = 'arn:aws:kms:us-east-1:687285989071:key/d7606f22-c7f9-4e7c-b73e-bb1c694941f6';
let Plaintext = 'super.secret<-thing->that is secret';
let k = 'secret';

(async () => {
  let response = await kms.encrypt ({KeyId, Plaintext}).promise ();
  let data = response.CiphertextBlob.toString ('base64');
  console.log (data);
  env [k] = data;
  fs.writeFile ('env.json', JSON.stringify (env));
  let decryptResponse = await kms.decrypt ({CiphertextBlob: Buffer (data, 'base64')}).promise ();
  console.log (decryptResponse.Plaintext.toString ());
}) ();



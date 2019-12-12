const {model, Schema, user, reqStr, now} = require ('./types');
// Schema
// saved in s3 with key `${upload._id}/${upload._id}`
const S3UploadSchema = new Schema ({
  // user that uploaded the file
  user,
  name: reqStr,
  alt: reqStr,
  mime: reqStr,
  extension: reqStr,
  createdAt: now
});

// no populate :)

module.exports = model ('S3Upload', S3UploadSchema);
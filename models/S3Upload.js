const mongoose = require ('mongoose');
const {user, reqStr, now} = require ('./types');
// Schema
// saved in s3 with key `${upload.user._id}$/{upload._id}`
const S3UploadSchema = new mongoose.Schema ({
  // user that uploaded the file
  user,
  name: reqStr,
  alt: reqStr,
  mime: reqStr,
  extension: reqStr,
  createdAt: now
});
// populate user on find of all kinds
function populate () {
  this.populate ({path: 'user', select: '_id first last username lastActive profilePicture'});
}
S3UploadSchema.pre ('findOne', populate);
S3UploadSchema.pre ('findById', populate);
S3UploadSchema.pre ('find', populate);

module.exports = mongoose.model ('S3Upload', S3UploadSchema);

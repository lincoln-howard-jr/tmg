const mongoose = require ('mongoose');
// Schema
const FileSchema = new mongoose.Schema ({
  // user that uploaded the file
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // grant permission to other users
  allowedUsers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  // mime type, sent as Content-Type header
  mime: String,
  // link to the gridfs store object for the file data
  file: mongoose.Schema.Types.ObjectId,
  // name
  filename: String
});
// populate user on find of all kinds
function populate () {
  this.populate ({path: 'user', select: '_id first last username lastActive profilePicture'});
  this.populate ({path: 'allowedUsers', select: '_id first last username lastActive profilePicture'});
}
FileSchema.pre ('findOne', populate);
FileSchema.pre ('findById', populate);
FileSchema.pre ('find', populate);

module.exports = mongoose.model ('File', FileSchema);

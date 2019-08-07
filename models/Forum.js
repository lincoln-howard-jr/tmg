const {Schema, model, user, reqStr, file, now} = require ('./types');

const ForumSchema = new Schema ({
  user,
  title: reqStr,
  description: reqStr,
  image: file,
  createdAt: now
});

function populate () {
  this.populate ({path: 'user', select: '_id first last username lastActive profilePicture'})
  this.populate ({path: 'image', select: '_id user name alt mime extension'});
}
ForumSchema.pre ('findOne', populate);
ForumSchema.pre ('findById', populate);
ForumSchema.pre ('find', populate);

module.exports = model ('Forum', ForumSchema);
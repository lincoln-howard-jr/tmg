const {Schema, model, user, reqStr, now, mdy} = require ('./types');
const ArticleSchema = new Schema ({
  user,
  title: reqStr,
  author: reqStr,
  summary: reqStr,
  tags: [String],
  url: reqStr,
  publishedDate: mdy,
  shared: now,
  source: String
});

function populate () {
  this.populate ({path: 'user', select: '_id first last username lastActive profilePicture'});
}

ArticleSchema.pre ('find', populate);
ArticleSchema.pre ('findById', populate);
ArticleSchema.pre ('findOne', populate);

module.exports = model ('Article', ArticleSchema);
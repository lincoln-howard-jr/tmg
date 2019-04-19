const mongoose = require ('mongoose');

const CommentSchema = new mongoose.Schema ({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

function populate () {
  this.populate ({path: 'user', select: '_id first last username lastActive profilePicture'});
}

CommentSchema.pre ('find', populate);
CommentSchema.pre ('findOne', populate);
CommentSchema.pre ('findById', populate);

module.exports = mongoose.model ('Comment', CommentSchema)
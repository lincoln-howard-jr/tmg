const mongoose = require ('mongoose');

const CommentSchema = new mongoose.Schema ({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
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
  this.populate ('parent');
}

CommentSchema.pre ('find', populate);
CommentSchema.pre ('findOne', populate);
CommentSchema.pre ('findById', populate);

module.exports = mongoose.model ('Comment', CommentSchema)
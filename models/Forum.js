const mongoose = require ('mongoose');

const ForumSchema= new mongoose.Schema ({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

function populate () {
  this.populate ({path: 'user', select: '_id first last username lastActive profilePicture'})
}
ForumSchema.pre ('findOne', populate);
ForumSchema.pre ('findById', populate);
ForumSchema.pre ('find', populate);

module.exports = mongoose.model ('Forum', ForumSchema);
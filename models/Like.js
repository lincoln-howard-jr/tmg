let mongoose = require ('mongoose');

let LikeSchema = new mongoose.Schema ({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  parnet: {
    type: mongoose.Schema.Types.ObjectId
  }
})

function populate () {
  this.populate ({path: 'user', select: '_id first last username lastActive profilePicture'});
}

LikeSchema.pre ('find', populate);
LikeSchema.pre ('findById', populate);
LikeSchema.pre ('findOne', populate);

module.exports = mongoose.model ('Like', LikeSchema);
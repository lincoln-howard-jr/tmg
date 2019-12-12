let mongoose = require ('mongoose');
const {reqStr, user} = require ('./types');

let ShareSchema = new mongoose.Schema ({
  user,
  type: reqStr,
  parent: {
    type: mongoose.Schema.Types.ObjectId
  },
  summary: reqStr
})

function populate () {
  this.populate ({path: 'user', select: '_id first last username lastActive profilePicture'});
}

ShareSchema.pre ('find', populate);
ShareSchema.pre ('findById', populate);
ShareSchema.pre ('findOne', populate);

module.exports = mongoose.model ('Share', ShareSchema);
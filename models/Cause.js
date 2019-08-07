const {Schema, model, user, reqStr, now, election, cause} = require ('./types');

const CauseSchema = new Schema ({
  user,
  title: String,
  actionPlan: String,
  created: now,
  election,
  phase: reqStr,
  prev: cause,
  old: {
    type: Boolean,
    default: false
  }
});

function populate () {
  this.populate ({path: 'user', select: '_id first last username lastActive profilePicture'});
}

CauseSchema.pre ('find', populate);
CauseSchema.pre ('findOne', populate);

module.exports = model ('Cause', CauseSchema);
const {Schema, model, reqStr, now, user, election, cause} = require ('./types');
const VoteSchema = new Schema ({
  user,
  election,
  cause,
  created: now,
  phase: reqStr
});

module.exports = model ('Vote', VoteSchema);
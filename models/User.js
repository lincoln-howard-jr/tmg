// imports
let {mongoose, file, reqStr, now} = require ('./types');
let {genSalt, hash, compare} = require ('bcrypt-nodejs');
// define user Schema
let UserSchema = new mongoose.Schema ({
  username: {
    ...reqStr,
    unique: true
  },
  password: reqStr,
  email: reqStr,
  phone: String,
  first: reqStr,
  last: reqStr,
  createdAt: now,
  admin: {
    type: Boolean,
    default: false
  },
  profilePicture: file,
  stripeCustomerId: String,
  subscribed: {
    type: Boolean,
    default: false
  },
  paidThrough: {
    month: Number,
    year: Number
  }
});
// create text search
UserSchema.index ({
  username: 'text',
  first: 'text',
  last: 'text'
})
// salt and hash password
UserSchema.methods.hash = function () {
  return new Promise ((resolve, reject) => {
    genSalt (10, (err, salt) => {
      if (err) return reject (err);
      hash (this.password, salt, () => {}, (err, value) => {
        if (err) return reject (err);
        this.password = value;
        this.save (() => {
          resolve (this);
        });
      });
    })
  });
}
// verify password
UserSchema.methods.comparePassword = function (password) {
  return new Promise ((resolve, reject) => {
    compare (password, this.password, (err, match) => {
      if (err) return reject (err);
      resolve (match);
    });
  });
}

module.exports = mongoose.model ('User', UserSchema);

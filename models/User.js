// imports
let mongoose = require ('mongoose');
let {genSalt, hash, compare} = require ('bcrypt-nodejs');
// define user Schema
let UserSchema = new mongoose.Schema ({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: String,
  first: String,
  last: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  admin: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
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

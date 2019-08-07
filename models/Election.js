const {Schema, model, my, mdy, cause} = require ('./types');
const ElectionSchema = new Schema ({
  month: my,
  prelim: {
    open: mdy,
    close: mdy,
    result: cause
  },
  general: {
    open: mdy,
    close: mdy,
    result: cause
  }
});

module.exports = model ('Election', ElectionSchema)
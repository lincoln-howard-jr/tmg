const {Schema, model, reqStr} = require ('./types');
const SourceSchema = new Schema ({
  url: reqStr,
  name: reqStr
});

module.exports = model ('Source', SourceSchema)
const mongoose = require ('mongoose');
const getEnv = require ('../getEnv');
// instance vars, don't repeat the process if already connected
let connected = false, dbUri;
// method call to connect to db
const connectToDb = async () => {
  return new Promise (async (resolve, reject) => {
    try {
      if (connected) return resolve (dbUri);
      dbUri = await getEnv ('dbUri');
      mongoose.connect (dbUri, {useNewUrlParser: true, useCreateIndex: true}, err => {
        if (err) return reject (err);
        connected = true;
        resolve (dbUri);
      });
    } catch (e) {
      reject (e);
    }
  });
}
// middleware calling connectToDb
const dbMiddleware = async (req, res, next) => {
  console.log ('connecting to db');
  try {
    req.dbUri = await connectToDb ();
    console.log ('successfully connected to db');
    next ();
  } catch (e) {
    console.log (e);
    res.status (500).json ({reason: 'unable to connect to database'});
  }
}
// export both methods
module.exports = {connectToDb, dbMiddleware};
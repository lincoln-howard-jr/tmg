const decryptEnv = (env) => {
  return new Promise ((resolve, reject) => {
    kms.decrypt ({CiphertextBlob: new Buffer (process.env [env])}, (err, data) => {
      if (err) return reject (err);
      resolve (data.Plaintext.toString ());
    });
  });
}
// sessions (<express application>, <passport instance>, <String>);
module.exports = async (app, session_db) => {
  console.log (`creating session middleware`)
  // import session middleware
  let session = require ('express-session');
  // import cookie parser
  let cookieParser = require ('cookie-parser');
  app.use (cookieParser (secret));
  // import the store module, bind to session middleware
  let MongoStore = require ('connect-mongo') (session);
  // create mongo store
  let store = new MongoStore ({url: await decryptEnv ('MONGODB_URI')});
  // create and apply the session
  app.use (session ({
    name: 'tmg.sid',
    secret: await decryptEnv ('SECRET'),
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    },
    store
  }));
  // passport configuration
  require ('./passport-local');
  require ('./passport');
  // apply passport
  app.use (passport.initialize ());
  app.use (passport.session ());
}

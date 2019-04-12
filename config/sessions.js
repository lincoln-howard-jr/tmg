// sessions (<express application>, <passport instance>, <String>);
module.exports = (app, dbUri, secret) => {
  return new Promise ((resolve, reject) => {
    console.log (`creating session middleware`)
    // import session middleware
    let session = require ('express-session');
    // import cookie parser
    let cookieParser = require ('cookie-parser');
    app.use (cookieParser (secret));
    // import the store module, bind to session middleware
    let MongoStore = require ('connect-mongo') (session);
    // create mongo store
    let store = new MongoStore ({url: dbUri});
    // create and apply the session
    app.use (session ({
      name: 'tmg.sid',
      secret,
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
    resolve ();
  });
}

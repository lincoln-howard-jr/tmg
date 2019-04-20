let getEnv = require ('../getEnv');
let mongoose = require ('mongoose');
// import sessions stuff
let session = require ('express-session') 
// sessions (<express application>, <passport instance>, <String>);
module.exports = async (req, res, next) => {
  try {
    // get secret
    let secret = await getEnv ('secret');
    // cookie parser middleware
    let cookieParser = require ('cookie-parser') (secret);
    // create session store
    let MongoStore = require ('connect-mongo') (session);
    let store = new MongoStore ({mongooseConnection: mongoose.connection});
    // create session middleware
    let runSesh = session ({
      name: 'tmg.sid',
      secret,
      resave: true,
      saveUninitialized: true,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24
      },
      store
    });
    // passport configuration
    require ('./passport-local');
    require ('./passport');
    // chain all functions together
    cookieParser (req, res, () => {
      console.log ('cookies parsed');
      runSesh (req, res, () => {
        console.log ('express session run');
        passport.initialize () (req, res, () => {
          console.log ('passport initialized')
          passport.session () (req, res, next)
        })
      })
    });
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
}
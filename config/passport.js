let User = require ('../models/User');

passport.serializeUser ((user, done) => {
  done (null, user._id);
});

passport.deserializeUser (async function (id, done) {
  try {
    let user = await User.findOne ({_id: id}).exec ();
    done (null, user);
  } catch (err) {
    done (err);
  }
});

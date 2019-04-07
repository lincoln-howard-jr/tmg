let User = require ('../models/User');
let localStrategy = require ('passport-local');
// create local strategy
passport.use (new localStrategy ({
  usernameField: 'username',
  passwordField: 'password'
}, async (username, password, done) => {
  console.log ('authenticating local user');
  try {
    username = username.toLowerCase ();
    let user = await User.findOne ({username}).exec ();
    if (!user) throw 'User not found...';
    let match = await user.comparePassword (password);
    if (!match) done (null, false);
    else done (null, user);
    console.log (user);
  } catch (e) {
    console.log (e);
    done (e);
  }
}))

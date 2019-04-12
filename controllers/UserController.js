// image handling and user functions
let express = require ('express');
let mongoose = require ('mongoose');
let User = require ('../models/User');
let File = require ('../models/File');
let Grid = require ('gridfs-stream');

let router = express.Router ();

const objectIdEquals = (a, b) => {
  return a.toString () === b.toString ();
}
//
// user controller section
//
router.get ('/users', async (req, res) => {
  try { 
    let limit = req.query.limit || 10;
    let offset = req.query.offset || 0;
    let q = {};
    let users = await User.find (q).skip (offset).limit (limit).select ('_id username first last lastActive createdAt profilePicture').exec ();
    res.json (users);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});

router.get ('/users/:id', async (req, res) => {
  try {
    let user = await User.findOne ({_id: req.params.id}).select ('_id username first last lastActive createdAt profilePicture').exec ();
    res.json (user);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});

router.post ('/users', async (req, res) => {
  if (req.user) res.status (404).json ();
  // validation
  try {
    console.log (req.body);
    // grab username and password
    let {username, password, email} = req.body;
    // check if username is unique
    let exists = await User.findOne ({username}).exec ();
    if (exists) throw new Error ('username already exists in namespace');
    // validate other fields
    let body = {};
    ['first', 'last', 'location', 'preferences', 'profilePicture'].forEach ((prop) => {
      if (req.body [prop]) body [prop] = req.body [prop];
    });
    // create user
    let user = new User ({
      username,
      password,
      email,
      ...body
    });
    await user.hash ();
    await user.save ();
    req.login (user, () => {
      res.json (user);
    })
  } catch (e) {
    console.log (e);
    return res.status (500).json ();
  }
});

router.get ('/me', async (req, res) => {
  if (!req.user) return res.status (404).end ();
  let ret = {};
  ['_id', 'first', 'last', 'username', 'preferences', 'lastActive', 'createdAt', 'admin', 'votes', 'profilePicture'].forEach ((prop) => {
    if (req.user [prop]) ret [prop] = req.user [prop];
  });
  res.json (ret);
})

router.put ('/me', async (req, res) => {
  res.status (404).json ({reason: 'handler not written'});
});

router.delete ('/me', async (req, res) => {
  res.status (404).json ({reason: 'handler not written'});
});
//
// session controller section
//
router.post ('/sessions', passport.authenticate ('local'), (req, res) => {
  if (!req.user) return res.status (401).json ({});
  let ret = {};
  ['_id', 'first', 'last', 'username', 'preferences', 'lastActive', 'createdAt', 'admin', 'votes', 'profilePicture'].forEach ((prop) => {
    if (req.user [prop]) ret [prop] = req.user [prop];
  });
  res.json (ret);
});

router.delete ('/sessions', async (req, res) => {
  if (!req.user) return res.status (401).end ();
  req.session.destroy ();
  res.clearCookie ('tmg.sid');
  res.json ({});
})

// 
// file controller section
// 
// get all files from this user
router.get ('/files', async (req, res) => {
  // wrap in t/c
  try {
    if (!req.user) return res.status (401).end ();
    let files = await File.find ({user: req.user._id}).exec ();
    res.json (files);
  } catch (e) {
    console.log (e);
    res.status (500).json (e);
  }
});
// get a file
router.get ('/files/:id', async (req, res) => {
  try {
    // setup grid
    Grid.mongo = require ('mongoose').mongo;
    const gfs = Grid (require ('mongoose').connection.db);
    // grab the file db record and make sure it exists
    let file = await File.findOne ({_id: req.params.id}).exec ();
    if (!file) return res.status (404).end ();
    // check that the file exists
    gfs.exist ({_id: file.file}, (err, found) => {
      if (err || !found) return res.status (404).end ();
      // send headers and file
      res.set ('Content-Type', file.mime);
      gfs.createReadStream ({
        _id: file.file
      }).pipe (res);
    });
  } catch (e) {
    // send 500 error
    res.status (500).json (e);
  }
});
// edit a file
router.put ('/files/:id', async (req, res) => {
  try {
    // setup grid
    Grid.mongo = require ('mongoose').mongo;
    const gfs = Grid (require ('mongoose').connection.db);
    // grab the file db record and make sure it exists
    let file = await File.findOne ({_id: req.params.id}).exec ();
    if (!file) return res.status (404).end ();
    // check that this is the owner
    if (!objectIdEquals (req.user._id, file.user._id)) return res.status (401);
    ['filename', 'file'].forEach ((prop) => {

    });
  } catch (e) {

  }
})
// echo with posting files
router.post ('/files', (req, res) => {
  res.json (req.body);
});

module.exports = router;
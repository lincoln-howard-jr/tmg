// image handling and user functions
let express = require ('express');
let mongoose = require ('mongoose');
let User = require ('../models/User');
let multer = require ('multer');
let multerS3 = require ('multer-s3');
const S3Upload = require ('../models/S3Upload');
const mime = require ('mime');
const AWS = require ('aws-sdk');
const s3 = new AWS.S3 ();
const bucket = 'image-bucket-for-tmg-frontend';
const MB = 1024 * 1024;
const fileSize = 100 * MB;

// multer/multers3 file store in aws s3 bucket
const upload = multer ({
  storage: multerS3 ({
    s3,
    bucket,
    metadata: (req, file, cb) => {
      cb (null, {fieldName: file.fieldname});
    },
    key: (req, file, cb) => {
      let s3upload = new S3Upload ({
        user: req.user._id,
        name: file.originalname,
        alt: file.fieldname,
        mime: file.mimetype,
        extension: mime.getExtension (file.mimetype)
      });
      s3upload.save ();
      cb (null, `${req.user._id}/${s3upload._id}.${mime.getExtension (file.mimetype)}`);
    }
  }),
})

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
    console.log ('running db query');
    let users = await User.find (q).skip (offset).limit (limit).select ('_id username first last lastActive createdAt profilePicture').exec ();
    console.log ('query complete');
    res.json (users);
    console.log ('responded with users');
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
  if (req.user) res.status (404).end ();
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
    ['first', 'last', 'location', 'preferences'].forEach ((prop) => {
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
  ['_id', 'subscribed', 'paidThrough', 'email', 'first', 'last', 'username', 'preferences', 'lastActive', 'createdAt', 'admin', 'votes', 'profilePicture'].forEach ((prop) => {
    if (req.user [prop]) ret [prop] = req.user [prop];
  });
  res.json (ret);
})

router.put ('/me', async (req, res) => {
  if (!req.user) return res.status (404).end ();
  ['preferences', 'profilePicture'].forEach ((prop) => {
    if (req.body [prop]) req.user [prop] = req.body [prop];
  });
  req.user.save ();
  res.json ({echo: req.body});
});

router.delete ('/me', async (req, res) => {
  res.status (404).json ({reason: 'handler not written'});
});
//
// session controller section
//
router.post ('/sessions', passport.authenticate ('local'), (req, res) => {
  if (!req.user) return res.status (401).send ('User could not be authenticated...');
  let ret = {};
  ['_id', 'first', 'last', 'username', 'preferences', 'lastActive', 'createdAt', 'admin', 'votes', 'profilePicture'].forEach ((prop) => {
    if (req.user [prop]) ret [prop] = req.user [prop];
  });
  res.json (ret);
});
// log out
router.delete ('/sessions', async (req, res) => {
  if (!req.user) return res.status (401).end ();
  req.session.destroy ();
  res.clearCookie ('tmg.sid');
  res.json ({});
})
// update password
router.post ('/update-password', async (req, res) => {
  
});
// 
// file controller section
// echo with posting files
router.post ('/files', upload.any (), (req, res) => {
  res.json (req.files);
});

router.get ('/files', async (req, res) => {
  if (!req.user) return res.status (401).end ();
  try {
    let uploads = await S3Upload.find ({user: req.user._id}).exec ();
    res.json (uploads);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});

module.exports = router;
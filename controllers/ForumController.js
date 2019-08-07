let Article = require ('../models/Article');
let Forum = require ('../models/Forum');
let Comment = require ('../models/Comment');
let Like = require ('../models/Like');
let Cause = require ('../models/Cause');
// shorthand to access commentable/likeable types
const modelDict = {
  articles: Article,
  forums: Forum,
  comments: Comment,
  causes: Cause
}

let router = require ('express').Router ();

const objectIdEquals = (a, b) => {
  return a.toString () === b.toString ();
}
// qs defaults
const defaults = {
  offset: 0,
  limit: 25
}
// check if an object exists
const exists = async (type, _id) => {
  // async method returns promise
  return new Promise (async (resolve, reject) => {
    // wrap in t/c
    try {
      // ensure valid type
      if (!type || !modelDict [type]) throw new TypeError (`"${type}" is not a valid type (articles, forums, comments)`);
      let results = await modelDict [type].find ({_id}).limit (1).exec ();
      if (results.length) return resolve (true);
      resolve (false);
    } catch (e) {
      reject (e);
    }
  });
}
// retrieve all of a certain type
// default qs provided, alternatively pass in req.query
const getByType = async (type, query={}) => {
  // async method returns promise
  return new Promise (async (resolve, reject) => {
    // wrap in t/c
    try {
      // ensure qs
      let qs = Object.assign (defaults, query);
      // ensure valid type
      if (!type || !modelDict [type]) throw new TypeError (`"${type}" is not a valid type (articles, forums, comments)`);
      // make query
      let results = await modelDict [type].find ({}).skip (qs.offset).limit (qs.limit).lean ().exec ();
      resolve (results);
    } catch (e) {
      reject (e);
    }
  });
}
// retrieve all comments on a certain type object
// default qs provided, alternatively pass in req.query
const getCommentsOn = async (type, parent, query={}) => {
  // async method returns promise
  return new Promise (async (resolve, reject) => {
    // wrap in t/c
    try {
      // ensure qs
      let qs = Object.assign (defaults, query);
      // ensure object found (type checking also done in global#exists)
      let _exists = await exists (type, parent);
      if (!_exists) throw 'Object not found...'
      let results = Comment.find ({parent}).skip (qs.offset).limit (qs.limit).lean ().exec ();
      resolve (results);
    } catch (e) {
      reject (e);
    }
  });
}
// get like count on a likeable object
// no type checking
const getLikeCount = async (type, parent) => {
  // async method returns promise
  return new Promise (async (resolve, reject) => {
    // wrap in t/c
    try {
      // ensure object found (type checking also done in global#exists)
      await exists (type, parent);
      let results = Like.count ({type, parent}).exec ();
      resolve (results);
    } catch (e) {
      reject (e);
    }
  });
}
// get whether or not logged in user liked a likeable object
const didILike = async (user, parent) => {
  return new Promise (async (resolve, reject) => {
    try {
      if (!user) throw 'User not defined';
      let exists = await Like.exists ({user: user._id, parent});
      resolve (exists);
    } catch (e) {
      reject (e);
    }
  })
}
router.get ('/articles', async (req, res) => {
  try {
    let data = await getByType ('articles', req.query);
    data = await Promise.all (data.map (article => {
      return new Promise (async (resolve, reject) => {
        let likeCount = await getLikeCount ('articles', article);
        let comments = await getCommentsOn ('articles', article);
        comments = await Promise.all (comments.map (comment => {
          return new Promise (async (_res, _rej) => {
            comment.likeCount = await getLikeCount ('comments', comment._id);
            // if logged in:
            if (req.user) comment.didILike = await didILike (req.user, comment);
            _res (comment);
          });
        }));
        resolve ({...t, likeCount, comments});
      });
    }));
    res.json ();
  } catch (e) {
    console.log (e);
    res.status (500).json (e);
  }
});
router.post ('/forums', async (req, res) => {
  try {
    if (!req.user) return res.status (401).end ();
    let obj = {
      user: req.user._id,
      title: req.body.title,
      description: req.body.description
    }
    let forum = new Forum (obj);
    forum.save ();
    res.json (forum);
  } catch (e) {
    console.log (e);
    res.status (500).json ({e});
  }
});


router.get ('/comments/:type/:parent', async (req, res) => {
  try {
    let comments = await getCommentsOn (req.params.type, req.params.parent);
    res.json (comments);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});

router.get ('/likes/:type/:parent', async (req, res) => {
  try {
    res.json (await getLikeCount (req.params.type, req.params.parent));
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});
module.exports = router;
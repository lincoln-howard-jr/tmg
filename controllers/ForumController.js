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
      let results = Like.countDocuments ({type, parent}).exec ();
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

// router.get ('/articles', async (req, res) => {
//   try {
//     let data = await getByType ('articles', req.query);
//     data = await Promise.all (data.map (article => {
//       return new Promise (async (resolve, reject) => {
//         let likeCount = await getLikeCount ('articles', article);
//         let comments = await getCommentsOn ('articles', article);
//         comments = await Promise.all (comments.map (comment => {
//           return new Promise (async (_res, _rej) => {
//             comment.likeCount = await getLikeCount ('comments', comment._id);
//             // if logged in:
//             if (req.user) comment.didILike = await didILike (req.user, comment);
//             _res (comment);
//           });
//         }));
//         resolve ({...t, likeCount, comments});
//       });
//     }));
//     res.json ();
//   } catch (e) {
//     console.log (e);
//     res.status (500).json (e);
//   }
// });

// router.post ('/forums', async (req, res) => {
//   try {
//     if (!req.user) return res.status (401).end ();
//     let obj = {
//       user: req.user._id,
//       title: req.body.title,
//       description: req.body.description
//     }
//     let forum = new Forum (obj);
//     forum.save ();
//     res.json (forum);
//   } catch (e) {
//     console.log (e);
//     res.status (500).json ({e});
//   }
// });

// middleware for getting comments on a type/parent
const getCommentsMiddleware =  async (req, res, next) => {
  try {
    let comments = await getCommentsOn (req.params.type, req.params.parent, req.query);
    req.comments = comments;
    next ();
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
}
// send comments back
router.get ('/comments/:type/:parent', getCommentsMiddleware, (req, res) => {
  res.json (req.comments);
});
// middleware for getting like count of a type/parent
const getLikeCountMiddleware = async (req, res, next) => {
  try {
    req.likeCount = await getLikeCount (req.params.type, req.params.parent);
    next ();
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
}
// send like count back
router.get ('/likes/:type/:parent', getLikeCountMiddleware, (req, res) => {
  res.json (req.likeCount);
});
// get forums middleware
// includes top comments and like count
const getForumsMiddleware = async (req, res, next) => {
  try {
    let forums = await getByType ('forums', req.query);
    console.log (forums);
    forums = await Promise.all (forums.map (async (f) => {
      console.log (f);
      return new Promise (async (resolve) => {
        try {
          let likes = await getLikeCount ('forums', f._id);
          let fDidILike = false;
          if (req.user) fDidILike = await didILike (req.user, f._id);
          let comments = await getCommentsOn ('forums', f._id);
          comments = await Promise.all (comments.map ((c) => {
            try {
              return new Promise (async (sub_resolve) => {
                let clikes = getLikeCount ('comments', c._id);
                let cDidILike = false;
                if (req.user) cDidILike = await didILike (req.user, c._id);
                sub_resolve ({...c, likes: clikes, didIlike: cDidILike});
              });
            } catch (e) {
              console.log (e);
              reject (e);
            }
          }));
          resolve ({...f, comments, likes, didILike: fDidILike});
        } catch (e) {
          console.log (e);
          reject (e);
        }
      });
    }));
    req.forums = forums;
    next ();
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
}
// send forums
router.get ('/forums', getForumsMiddleware, (req, res) => {
  res.json (req.forums);
});
// create a comment
router.post ('/comments/:type/:parent', async (req, res) => {
  try {
    let comment = new Comment ({
      user: req.user._id,
      comment: req.body.comment,
      type: req.params.type,
      parent: req.params.parent
    });
    await comment.save ();
    res.json (comment);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});

module.exports = router;
let Comment = require ('../models/Comment');
let Like = require ('../models/Like');
const {getByType, getCommentsOn, getLikeCount, getCommentCount, didILike} = require ('./helpers');

let router = require ('express').Router ();

// middleware for getting comments on a type/parent
const getCommentsMiddleware =  async (req, res, next) => {
  try {
    let query = {};
    if (req.user) query.user = req.user;
    let comments = await getCommentsOn (req.params.type, req.params.parent, req.query);
    comments = await Promise.all (comments.map ((c) => {
      return new Promise (async (resolve) => {
        try {
          let clikes = await getLikeCount ('comments', c._id);
          let subCommentCount = await getCommentCount ('comments', c._id, query);
          let cDidILike = false;
          if (req.user) cDidILike = await didILike (req.user, c._id);
          resolve ({...c, likes: clikes, subCommentCount, didIlike: cDidILike});
        } catch (e) {
          resolve ({...c});
        }
      });
    }));
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
  console.log (req.body);
  if (!req.user) return res.status (500).end ();
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
// create a like
router.post ('/likes/:type/:parent', async (req, res) => {
  try {
    let like = new Like ({
      user: req.user._id,
      type: req.params.type,
      parent: req.params.parent
    })
    await like.save ();
    res.json (like);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});

module.exports = router;
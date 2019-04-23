let Forum = require ('../models/Forum');
let Comment = require ('../models/Comment');
let Like = require ('../models/Like');

let router = require ('express').Router ();

const objectIdEquals = (a, b) => {
  return a.toString () === b.toString ();
}

const defaults = (query, limit="limit", skip="skip") => {
  return {
    limit: query [limit] || 10,
    skip: query [skip] || 0
  }
}

const allForums = async (skip=0, limit=10) => {
  return new Promise (async (resolve, reject) => {
    try {
      let forums = null;
      if (limit > 1) {
        forums = await Forum.find ({}).skip (skip).limit (limit).lean ().exec ();
      } else {
        forums = await Forum.findOne ({}).lean ().exec ();
      }
      console.log (forums);
      forums = await commentsOn (forums);
      resolve (forums);
    } catch (e) {
      reject (e);
    }
  }); 
}

const commentsOn = async (forums, skip=0, limit=10) => {
  return new Promise (async (resolve, reject) => {
    try {
      let _f = Array.isArray (forums) ? forums : [forums];
      let result = await Promise.all (_f.map (f => {
        return new Promise (async (resolve, reject) => {
          try {
            let totalComments = await Comment.count ({forum: f._id}).exec ();
            console.log (totalComments);
            let comments = await Comment.find ({forum: f._id}).skip (skip).limit (limit).lean ().exec ();
            comments = await likesOn (comments);
            console.log (comments);
            resolve ({
              ...f,
              comments,
              totalComments
            })
          } catch (e) {
            reject (e);
          }
        });
      }));
      if (Array.isArray (forums)) return resolve (result);
      resolve (result [0]);
    } catch (e) {
      reject (e);
    }
  })
}

const likesOn = async (comments, count=true, users=true, skip=0, limit=100) => {
  return new Promise (async (resolve, reject) => {
    try {
      let _c = Array.isArray (comments) ? comments : [comments];
      let result = await Promise.all (_c.map (c => {
        return new Promise (async (resolve, reject) => {
          try {
            if (users) {
              c.likes = await Like.find ({comment: c._id}).skip (skip).limit (limit).lean ().exec ();
            }
            if (count) {
              c.totalLikes = await Like.count ({comment: c._id}).exec ();
            }
            resolve (c);
          } catch (e) {
            reject (e);
          }
        })
      }));
      if (Array.isArray (comments)) return resolve (result);
      resolve (result [0]);
    } catch (e) {
      reject (e);
    }
  });
}

const didILike = async (comments) => {

}

router.get ('/forums', async (req, res) => {
  let {skip, limit} = defaults (req.query);
  try {
    // let raw = await Forum.find ({}).skip (skip).limit (limit).lean ().exec ();
    // let forums = await Promise.all (raw.map (forum => new Promise (async (resolve, reject) => {
    //   try {
    //     let comments = await Comment.find ({forum: forum._id}).skip (defaults.skip).limit (defaults.limit).lean ().exec ();
    //     resolve ({
    //       ...forum,
    //       comments
    //     });
    //   } catch (e) {
    //     reject (e);
    //   }
    // })));
    // res.json (forums);
    let forums = await allForums ()
    res.json (forums);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});
router.get ('/forums/:id', async (req, res) => {
  try {
    let raw = await Forum.findOne ({_id: req.params.id}).lean ().exec ();
    let forum = {
      ...raw
    }
    res.json (forum);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
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

router.get ('/forums/:id/comments', async (req, res) => {
  let {skip, limit} = defaults (req.query);
  try {
    let comments = await Comment.find ({forum: req.params.id}).skip (skip).limit (limit).lean ().exec ();
    res.json (comments);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
})

router.post ('/forums/:id/comments', async (req, res) => {
  try {
    if (!req.user) return res.status (401).end ();
    let forum = await Forum.findOne ({_id: req.params.id}).exec ();
    console.log (forum);
    if (!forum) return res.status (404).end ();
    let comment = new Comment ({
      user: req.user._id,
      forum: req.params.id,
      comment: req.body.comment
    });
    await comment.save ();
    res.json (comment);
  } catch (e) {
    console.log (e);
    res.status (500).json ({e});
  }
});

router.post ('/forums/:fid/comments/:cid/likes', async (req, res) => {
  try {
    if (!req.user) return res.status (401).end ();
    let comment = await Comment.findOne ({_id: req.params.cid, forum: req.params.fid}).exec ();
    if (!comment) return res.status (404).end ();
    await new Like ({comment: comment._id, user: req.user._id}).save ();
    comment.likes++;
    await comment.save ();
    res.json (comment);
  } catch (e) {
    console.log (e);
    res.status (500).json ({e});
  }
})

module.exports = router;
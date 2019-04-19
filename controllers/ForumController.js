let Forum = require ('../models/Forum');
let Comment = require ('../models/Comment');

let router = require ('express').Router ();

const objectIdEquals = (a, b) => {
  return a.toString () === b.toString ();
}

const defaults = {
  limit: 10,
  skip: 0
}

router.get ('/forums', async (req, res) => {
  try {
    let raw = await Forum.find ({}).skip (defaults.skip).limit (defaults.limit).lean ().exec ();
    let forums = await Promise.all (raw.map (forum => new Promise (async (resolve, reject) => {
      try {
        let comments = await Comment.find ({forum: forum._id}).skip (defaults.skip).limit (defaults.limit).lean ().exec ();
        resolve ({
          ...forum,
          comments
        });
      } catch (e) {
        reject (e);
      }
    })));
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
  try {
    let comments = await Comment.find ({forum: req.params.id}).skip (defaults.skip).limit (defaults.limit).lean ().exec ();
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

module.exports = router;
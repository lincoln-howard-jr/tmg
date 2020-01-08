const router = require ('express').Router ();
const Article = require ('../models/Article');
const Source = require ('../models/Source');

const format = article => {
  return {
    _id: article._id,
    url: article.url,
    user: article.user,
    articleMetadata: {
      title: article.title,
      author: article.author,
      datePublished: article.publishedDate
    },
    userInterpretation: {
      summary: article.summary,
      tags: article.tags
    },
    shareCount: 1,
    likeCount: 1,
    commentCount: 1
  }
}

const {getLikeCount, getCommentCount, getByType, shareById} = require ('./helpers');

const getShareCount = async (url) => {
  return new Promise (async (resolve,reject) => {
    try {
      let count = await Article.countDocuments ({url}).exec ();
      resolve (count);
    } catch (e) {
      reject (e);
    }
  });
}

const getSharesBySource = async (source) => {
  return new Promise (async (resolve,reject) => {
    try {
      let count = await Article.countDocuments ({source}).exec ();
      resolve (count);
    } catch (e) {
      reject (e);
    }
  });
}


router.post ('/shares/:type/:parent', async (req, res) => {
  try {
    let share = await shareById (req.user._id, req.params.type, req.params.parent, req.body.summary);
    res.json (share);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
})
// get articles
router.get ('/articles', async (req, res) => {
  try {
    let articles = await getByType ('articles', {user: req.user});
    articles = articles.map (format);
    res.json (articles);
  } catch (e) {
    console.log (e)
    res.status (500).end ();
  }
});
// router.get ('/articles', async (req, res) => {
//   // t/c
//   try {
//     let query = {};
//     if (req.query) {
//       ['user', 'title', 'author', 'summary', 'url', 'source', 'tags'].forEach (q => {
//         if (req.query [q]) query [q] = req.query [q];
//       });
//       ['month', 'day', 'year'].forEach (k => {
//         if (!query.datePublished) query.datePublished = {};
//         query.datePublished [k] = req.query [k];
//       })
//     }
//     let articles = await Article.find (query).exec ();
//     articles = await Promise.all (articles.map (async (a) => {
//       return new Promise (async (resolve, reject) => {
//         try {
//         let likeCount = await getLikeCount ('articles', a._id, {...req.query, user: req.user});
//         let commentCount = await getCommentCount ('articles', a._id, {...req.query, user: req.user});
//         let shareCount = await getShareCount (a._id);
//         resolve ({
//           ...a,
//           articleMetadata: {
//             title: a.title,
//             author: a.author,
//             datePublished: a.datePublished
//           },
//           userInterpretation: {
//             summary: a.summary,
//             tags: a.tags
//           },
//           likeCount,
//           shareCount,
//           commentCount
//         });
//       } catch (e) {
//         reject (e);
//       }
//     });
//   }))
//     res.json (articles);
//   } catch (e) {
//     console.log (e);
//     res.json ({e});
//   }
// });
// share an article
router.post ('/articles', async (req, res) => {
  try {
    if (!req.user) return res.status (401).end ();
    let obj = {user: req.user._id, publishedDate: {}};
    let err = [];
    // validation
    ['url', 'author', 'title', 'summary'].forEach (prop => {
      if (!req.body [prop]) return err.push (`missing required field "${prop}"`);
      obj [prop] = req.body [prop];
    });
    ['month', 'day', 'year'].forEach (prop => {
      if (!req.body [prop]) return err.push (`missing required field "${prop}"`);
      obj.publishedDate [prop] = req.body [prop];
    });
    // send error if request is bad
    if (err.length) return res.status (400).json (err);
    // create and send article
    let article = new Article (obj);
    await article.save ();
    res.json (article)
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});

// 
// sources 
// 
router.get ('/sources', async (req, res) => {
  try {
    let sources = await getByType ('sources', {user: req.user});
    res.json (sources);
  } catch (e) {
    console.log (e)
    res.status (500).end ();
  }
})

router.post ('/sources', async (req, res) => {
  try {
    if (!req.user) return res.status (401).end ();
    let source = new Source (req.body);
    res.json (source);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
})
module.exports = router;
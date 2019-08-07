const router = require ('express').Router ();
const Article = require ('../models/Article');

// get articles based on mode
router.get ('/articles', async (req, res) => {
  // t/c
  try {
    let articles = await Article.find ({}).exec ();
    res.json (articles);
  } catch (e) {
    console.log (e);
    res.json ({e});
  }
});

router.post ('/articles', async (req, res) => {
  // t/c
  try {
    if (!req.user) res.status (401).end ();
    let obj = {user: req.user._id};
    let err = [];
    // required fields
    ['url', 'title', 'summary', 'tags'].forEach (prop => {
      if (!req.body [prop]) return err.push (`missing required field "${prop}"`);
      obj [prop] = req.body [prop];
    })
    // published date field
    if (!req.body.publishedDate) {
      err.push ('missing required field "publishedDate"')
    } else {
      obj.publishedDate = {};
      // mdy of published date
      ['month', 'day', 'year'].forEach (prop => {
        if (!req.body.publishedDate [prop]) return err.push (`missing required field "publishedDate.${prop}"`);
        obj.publishedDate [prop] = req.body.publishedDate [prop];
      });
    }
    // send error if request is bad
    if (err.length) return res.status (400).json (err);
    // create save and respond with article
    let article = new Article (obj);
    await article.save ();
    res.json (article);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
})

module.exports = router;
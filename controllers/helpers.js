let Forum = require ('../models/Forum');
let Article = require ('../models/Article');
let Comment = require ('../models/Comment');
let Like = require ('../models/Like');
let Cause = require ('../models/Cause');
let Share = require ('../models/Share');
let Source = require ('../models/Source')
// shorthand to access commentable/likeable types
const possibleParentModelsDict = {
  forums: Forum,
  comments: Comment,
  causes: Cause,
  articles: Article,
  shares: Share,
  sources: Source
}

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
      if (!type || !possibleParentModelsDict [type]) throw new TypeError (`"${type}" is not a valid type (articles, forums, comments)`);
      let results = await possibleParentModelsDict [type].find ({_id}).limit (1).exec ();
      if (results.length) return resolve (true);
      resolve (false);
    } catch (e) {
      reject (e);
    }
  });
}
// retrieve all of a certain type
// default qs provided, alternatively pass in req.query
const getByType = async (type, query={}, id) => {
  // async method returns promise
  return new Promise (async (resolve, reject) => {
    // wrap in t/c
    try {
      console.log (`get ${type}`);
      // ensure qs
      let qs = Object.assign (defaults, query);
      // ensure valid type
      if (!type || !possibleParentModelsDict [type]) throw new TypeError (`"${type}" is not a valid type (articles, forums, comments)`);
      // make query from querystring parameters and id if supplied
      let q = ['user', 'election', 'phase', 'old'].reduce ((acc, val) => {
        return (query [val] ? {...acc, [val]: query [val]} : acc);
      }, {});
      if (id) q._id = id;
      let results = await possibleParentModelsDict [type].find (q).lean ().exec ();
      
      // TODO: add query string stuff
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
      let results = await Comment.find ({parent}).skip (qs.offset).limit (qs.limit).lean ().exec ();
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
// get comment count on a commentable type object
// no type checking
const getCommentCount = async (type, parent) => {
  // async method returns promise
  return new Promise (async (resolve, reject) => {
    // wrap in t/c
    try {
      // ensure object found (type checking also done in global#exists)
      await exists (type, parent);
      let results = Comment.countDocuments ({type, parent}).exec ();
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
      let results = await Like.find ({user: user._id, parent}).limit (1).exec ();
      return resolve (!!results.length);
    } catch (e) {
      reject (e);
    }
  })
}

// share anything
const shareById = async (user, type, parent, summary) => {
  return new Promise (async (resolve, reject) => {
    try {
      // check if all arguemnts are valid
      if (!user) throw 'user not valid';
      if (!possibleParentModelsDict [type]) throw 'type not valid';
      await exists (type, parent);
      if (!summary) throw 'summary invalid';
      // create the share
      let share = new Share ({user, type, parent, summary});
      await share.save ();
      resolve (share);
    } catch (e) {
      reject (e);
    }
  });
}

module.exports = {
  possibleParentModelsDict,
  objectIdEquals,
  defaults,
  exists,
  getByType,
  getCommentsOn,
  getLikeCount,
  getCommentCount,
  didILike,
  shareById
}
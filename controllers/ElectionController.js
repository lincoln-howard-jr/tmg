const Election = require ('../models/Election');
const Cause = require ('../models/Cause');
const Vote = require ('../models/Vote');
const User = require ('../models/User');
const {DateRange, MonthDayYear, MonthYear} = require ('../models/types');
const {getByType, getCommentsOn, getLikeCount, getCommentCount, didILike} = require ('./helpers');

const router = require ('express').Router ();

// qs defaults
const defaults = {
  offset: 0,
  limit: 25,
  user: false,
  now: new MonthDayYear ()
}

const initElection = async (my=new MonthYear ()) => {
  return new Promise (async (resolve, reject) => {
    try {
      let prelimStart = new MonthDayYear (my);
      let prelim = new DateRange (prelimStart, prelimStart.next ()).toJSON ();
      let generalStart = new MonthDayYear ({...my, day: 22});
      let general = new DateRange (generalStart, generalStart.next ()).toJSON ();
      month = my.toJSON ();
      let election = new Election ({ month, prelim, general });
      await election.save ();
      resolve (election);
    } catch (e) {
      reject (e);
    }
  });
}

// create cause without title or action plan
const getMyCause = async (election, user) => {
  return new Promise (async (resolve, reject) => {
    try {
      let phase = getPhaseOf (election);
      if (phase === 'concluded' || phase === 'embryo' || phase === 'general') reject ('cannot create new causes');
      let found = await Cause.findOne ({ election, phase, user: user._id, old: false }).lean ().exec ();
      if (found) {
        found = await getAllRevisions (found, {user});
        found.likeCount = await getLikeCount ('causes', found._id);
        found.comments = await getCommentsOn ('causes', found._id);
      }
      if (found) return resolve (found);
      let cause = new Cause ({ election, phase, user: user._id });
      await cause.save ();
      resolve (cause.toObject ());
    } catch (e) {
      reject (e);
    }
  });
}

const myCauseMiddleware = async (req, res, next) => {
  try {
    console.log (req.election._id, req.user._id);
    req.cause = await getMyCause (req.election, req.user);
    console.log (req.cause);
    next ();
  } catch (e) {
    console.log (`err in myCauseMiddleware for ${req.path} for user with _id: [${req.user ? req.user._id : 'n/a'}]`);
    console.log (e);
    res.status (500).end ();
  }
}

//  create vote
//  steps:
//    check if a user has paid
//    get current election cycle and phase
//    ensure election exists and is in a valid voting phase
//    ensure user hasn't voted already
//    create and save vote in election during phase
//    if err -> reject with err
//    else -> resolve with vote
const initVote = async (user, cause) => {
  return new Promise (async (resolve, reject) => {
    try {
      // if the user isn't paid
      if (new MonthYear ().compare (user.paidThrough) < 0) return reject ('user not paid');
      // get election and phase
      let election = await getCurrentElection ();
      let phase = await getCurrentPhase ();
      // no election
      if (!election) reject ('no election');
      // check the phase and if the user voted in that phase
      if (phase !== 'general') reject ('not active');
      let alreadyVoted = await Vote.exists ({user, election, phase}).exec ();
      if (alreadyVoted) return reject ('already voted');
      // check that the cause exists
      let _cse = await Cause.findOne ({election, phase, _id: cause}).lean ().exec ();
      if (!_cse) return reject ('cause not found');
      // create save resolve - vote
      let vote = new Vote ({user, cause, election, phase});
      await vote.save ();
      resolve (vote.toObject ());
    } catch (e) {
      reject (e);
    }
  });
}

// init vote turned into middleware
const voteMiddleware = async (req, res) => {
  try {
    let vote = await initVote (req.user, req.body.cause);
    res.json (vote);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
}

// get election in session at a given month
// default month is the current month
const getElection = async (my=new MonthYear ()) => {
  return new Promise (async (resolve, reject) => {
    try {
      // await find current mm/yyyy election
      let elec = await Election.findOne ({month: my.toJSON ()}).lean ().exec ();
      resolve (elec);
    } catch (e) {
      reject (e);
    }
  });
}
// if successfully found, attaches election to req
// if election not found sends 404, if error logs error and send 500
const electionMiddleware = async (req, res, next) => {
  try {
    let my = new MonthYear ();
    if (req.params.mm && req.params.yyyy) {
      let month = parseInt (req.params.mm);
      let year = parseInt (req.params.yyyy);
      my = new MonthYear ({month, year});
      let election = await getElection (my);
      if (!election) return res.status (404).send (`election not found for ${month}/${year}`);
      req.election = election;
    } else {
      let election = await getElection ();
      if (!election) throw `election not found for current month/year`;
      req.election = election;
    }
    let now = new MonthDayYear ();
    if (req.params.dddd) {
      let day = parseInt (req.params.dddd);
      now = new MonthDayYear ({...my, day});
    }
    req.phase = getPhaseOf (req.election, now);
    next ();
  } catch (e) {
    console.log (`err in electionMiddleware for ${req.path} for user with _id: [${req.user ? req.user._id : 'n/a'}]`);
    console.log (e);
    res.status (500).end ();
  }
}
// retrieve causes for a specific election
const getCauses = async (election, query, id) => {
  return new Promise (async (resolve, reject) => {
    try {
      let qs = Object.assign (defaults, query);
      let phase = getPhaseOf (election, qs.now);
      let causes = await getByType ('causes', {election: election._id}, id);
      causes = await Promise.all (causes.map ((c) => {
        return new Promise (async (resolve, reject) => {
          try {
            let wRevs = await getAllRevisions (c, query);
            wRevs.likeCount = await getLikeCount ('causes', c._id, query);
            wRevs.comments = await getCommentsOn ('causes', c._id, query);
            wRevs.didILike = (query.user ? await didILike (query.user, c._id) : false);
            resolve (wRevs);
          } catch (e) {
            console.log (e);
            reject (e);
          }
        })
      }));
      resolve (causes);
    } catch (e) {
      reject (e);
    }
  });
}

// revise a cause with new title and action plan, resolve with
const reviseCause = async (election, user, title, actionPlan) => {
  console.log (election, user, title, actionPlan);
  return new Promise (async (resolve, reject) => {
    try {
      let phase = getPhaseOf (election);
      let prev = await Cause.findOne ({election: election._id, phase, user: user._id, old: false }).exec ();
      if (prev) {
        prev.old = true;
        await prev.save ();
      }
      let cause = new Cause ({election: election._id, phase, title, actionPlan, user: user._id, prev});
      await cause.save ();
      resolve (cause.toObject ());
    } catch (e) {
      reject (e);
    }
  });
}

// get revisions on a cause
const getCauseById = async (_id, query) => {
  return new Promise (async (resolve, reject) => {
    try {
      let cause = await Cause.findOne ({_id}).lean ().exec ();
      cause.likeCount = await getLikeCount ('causes', _id);
      cause.comments = await getCommentsOn ('causes', _id);
      cause.didILike = (query.user ? await didILike (query.user, _id) : false);
      resolve (cause);
    } catch (e) {
      reject (e);
    }
  });
}

// 
const getAllRevisions = async (cause, query) => {
  return new Promise (async (resolve, reject) => {
    try {
      let revisions = [];
      let next = cause.prev;
      while (!!next) {
        let _n = await getCauseById (next, query);
        next = _n.prev;
        revisions.push (_n);
      }
      resolve ({...cause, revisions});
    } catch (e) {
      reject (e);
    }
  });
}

// atecedent of electionMiddleware
// attaches causes to req
// 500 error if unknown error found
const causeMiddleware = async (req, res, next) => {
  try {
    if (req.params.id) {
      req.causes = await getCauseById (req.params.id, {...req.query, user: req.user});
    } else {
      req.causes = await getCauses (req.election, {...req.query, user: req.user});
    }
    next ();
  } catch (e) {
    console.log (`err in causeMiddleware for ${req.path} for user with _id: [${req.user ? req.user._id : 'n/a'}]`);
    console.log (e);
    res.status (500).end ();
  }
}

const getPhaseOf = (election, now=new MonthDayYear ()) => {
  // compare everything to now
  if (now.compare (election.prelim.open) !== now.compare (election.prelim.close)) return 'prelim';
  if (now.compare (election.general.open) !== now.compare (election.general.open)) return 'general';
  if (now.compare (election.prelim.close) !== now.compare (election.general.close)) return 'intermediate';
  if (now.compare (election.prelim.open) < 0) return 'embryo';
  return 'concluded';
}

// router.get ('/elections', async (req, res) => {
//   try {
//     let elections = await Election.find ({}).lean ().exec ();
//     let now = new MonthDayYear ();
//     elections = elections.map (e => Object.assign (e, {phase: getPhaseOf (e, now)}));
//   } catch (e) {
//     console.log (e);
//     res.status (500).end ();
//   }
// });

router.get ('/elections/:mm,:dddd,:yyyy', electionMiddleware, (req, res) => {
  res.json ({...req.election, phase: req.phase});
});

router.get ('/current-election', electionMiddleware, (req, res) => {
  res.json ({...req.election, phase: req.phase});
});

router.get ('/elections/:mm,:dddd,:yyyy/causes', electionMiddleware, causeMiddleware, (req, res) => {
  res.json (req.causes);
});

router.get ('/current-election/causes', electionMiddleware, causeMiddleware, (req, res) => {
  res.json (req.causes);
});

router.get ('/elections/:mm,:dddd,:yyyy/my-cause', electionMiddleware, myCauseMiddleware, (req, res) => {
  res.json (req.cause);
});

router.get ('/current-election/my-cause', electionMiddleware, myCauseMiddleware, (req, res) => {
  res.json (req.cause);
});

router.post ('/current-election/my-cause', electionMiddleware, async (req, res) => {
  try {
    console.log (req.election, req.user, req.body);
    let cause = await reviseCause (req.election, req.user, req.body.title, req.body.actionPlan);
    res.json (cause);
  } catch (e) {
    console.log (e);
    res.status (500).end ();
  }
});

router.get ('/current-election/causes/:id', electionMiddleware)

router.post ('/current-election/votes', electionMiddleware, async (req, res) => {
  try {

  } catch (e) {
    
  }
});

module.exports = router;
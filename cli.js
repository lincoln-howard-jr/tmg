// imports
const readline = require ('readline').createInterface ({
  input: process.stdin,
  output: process.stdout
});
const {writeFileSync} = require ('fs');
const {connectToDb} = require ('./config/connectToDb');
const User = require ('./models/User');
const Election = require ('./models/Election');
const Cause = require ('./models/Cause');
let dotfile = {};
try {
  dotfile = require ('./.tmg-data.json');
} catch (e) {
}
// async/await readline
const question = async (q) => {
  return new Promise ( resolve => {
    readline.question (q + ': ', answer => resolve (answer));
  });
}
// db types
let types = {
  user: require ('./models/User'),
  election: require ('./models/Election'),
  cause: require ('./models/Cause'),
  forum: require ('./models/Forum'),
  String,
  Number
};
// commands
let cmdOpts = [
  'create',
  'list',
  'delete',
  'select'
];
let cmdVerbs = [
  'creating',
  'retrieving',
  'removing',
  'selecting'
]
// sub commands
let subCmdOpts = [
  'user',
  'election',
  'cause',
  'forum'
];
// fields for creation/deletion/selection
let subCmdFields = [
  '#username:String #email:String #password:String +first:String +last:String -phone:String',
  '#month.month:Number #month.year:Number',
  '#user:user #title:String #actionPlan:String #election:election #phase:String',
  '#user:user #title:String #description:String'
];
let accessModifiers = {
  '#': 'Required',
  '+': 'Recommended',
  '-': 'Optional'
}
// record command/sub-command for use later
let command, subCommand = -1;
if (process.argv.length === 2) {
  // do not allow empty
  console.error ('Must provide command to for cli');
  console.error ('options include:' + cmdOpts.join (' | '));
  process.exit ();
} else if (process.argv.length === 3) {
  // solo command, interactive choice of sub-command
  command = cmdOpts.indexOf (process.argv [2]);
  if (command === -1) {
    console.error ('Command not recognized');
    console.error ('options include:' + cmdOpts.join (' | '));
    process.exit ();
  }
} else {
  // cmd+sub, jump right to field input, but ignore other commands
  command = cmdOpts.indexOf (process.argv [2]);
  if (command === -1) {
    console.error ('Command not recognized');
    console.error ('options include:' + cmdOpts.join (' | '));
    process.exit ();
  }
  subCommand = subCmdOpts.indexOf (process.argv [3]);
  if (subCommand === -1) {
    console.error ('Sub-command not recognized');
    console.error ('options include:' + subCmdOpts.join (' | '));
    process.exit ();
  }
}
// interactively create user
const runCreateUser = async () => {
  return new Promise (async (resolve) => {
    console.log ('Please fill out the following information...');
    let obj = {};
    obj.first = await question ('First name');
    obj.last = await question ('Last name');
    obj.email = await question ('Email');
    obj.username = await question ('Username');
    obj.phone = await question ('(Optional) Phone number');
    obj.password = await question ('Password');
    console.log ('Creating user...');
    let user = new User (obj);
    await user.hash ();
    await user.save ();
    dotfile.user = user;
    writeFileSync ('.tmg-data.json', JSON.stringify (dotfile, null, '\t'));
    resolve (user);
  });
}
// interactively select user by username
const runSelectUser = async () => {
  return new Promise (async (resolve) => {
    let username = await question ('Enter username');
    let user = await User.findOne ({username}).lean ().exec ();
    dotfile.user = user;
    writeFileSync ('.tmg-data.json', JSON.stringify (dotfile, null, '\t'));
    resolve (user);
  });
}
// interactively create election
const runCreateElection = async () => {
  return new Promise (async (resolve) => {
    console.log ('Please fill out the following information...');
    let obj = {month: {}};
    obj.month.month = parseInt (await question ('Month'));
    obj.month.year = parseInt (await question ('Year'));
    obj.prelim = {
      open: {...obj.month, day: 1},
      close: {...obj.month, day: 2}
    },
    obj.general = {
      open: {...obj.month, day: 22},
      open: {...obj.month, day: 23}
    }
    let election = new Election (obj);
    election.save ();
    dotfile.election = election;
    writeFileSync ('.tmg-data.json', JSON.stringify (dotfile, null, '\t'));
    resolve (election);
  });
}
// interactively select election
const runSelectElection = async () => {
  return new Promise (async (resolve) => {
    let month = {};
    month.month = parseInt (await question ('Month'));
    month.year = parseInt (await question ('Year'));
    let election = await Election.findOne ({month}).lean ().exec ();
    dotfile.election = election;
    writeFileSync ('.tmg-data.json', JSON.stringify (dotfile, null, '\t'));
    resolve (election);
  });
}
// interactive cause
const runCreateCause = async () => {
  return new Promise (async (resolve) => {
    console.log ('Please fill out the following information...');
    let obj = {
      user: dotfile.user._id,
      election: dotfile.election._id,
      phase: 'prelim'
    };
    obj.title = await question ('Title');
    obj.actionPlan = await question ('Action plan');
    let cause = new Cause (obj);
    await cause.save ();
    dotfile.cause = cause;
    writeFileSync ('.tmg-data.json', JSON.stringify (dotfile, null, '\t'));
    resolve (cause);
  })
}
// select a cause
const runSelectCause = async () => {
  return new Promise (async (resolve) => {
    if (!dotfile.election) {
      console.log ('\nNo election was selected, must select election first...\n');
      await runSelectElection ();
    }
    let causes = await Cause.find ({election: dotfile.election._id, old: false}).lean ().exec ();
    console.log ('Causes...');
    causes.forEach ((cause, i) => {
      console.log (`  ${i + 1}) ${cause.title} - ${cause.user.first} ${cause.user.last}`);
    });
    let selection = 0;
    while (selection <= 0 || selection > causes.length) {
      selection = parseInt (await question (`Number of cause (must be in range 1-${causes.length})`));
    }
    writeFileSync ('.tmg-data.json', JSON.stringify (dotfile, null, '\t'));
    resolve (dotfile.cause);
  });
}
// run main logic
(async () => {
  // can i get a connection?
  console.log ('connecting to database' + '\n');
  let dbUri = await connectToDb ();
  console.log ('\n' + 'connection successful to db at ' + dbUri + '\n');
  // get sub command if not already there
  while (subCommand === -1) {
    let answer = await question ('Choose one of (' + subCmdOpts.join (' | ') + ')');
    subCommand = subCmdOpts.indexOf (answer);
  }
  // inform user what were doing
  console.log ('\n' +  cmdVerbs [command] + ' ' + subCmdOpts [subCommand] + '\n');
  // create
  if (command === 0 && subCommand === 0) await runCreateUser ();
  if (command === 0 && subCommand === 1) await runCreateElection ();
  if (command === 0 && subCommand === 2) await runCreateCause ();
  if (command === 3 && subCommand === 0) await runSelectUser ();
  if (command === 3 && subCommand === 1) await runSelectElection ();
  if (command === 3 && subCommand === 2) await runSelectCause();
  process.exit ();
}) ();
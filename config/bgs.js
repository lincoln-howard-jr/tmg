'use strict'
// imports
let mongoose = require ('mongoose');
let is = require ('type-is');
let Grid = require ('gridfs-stream');
let Busboy = require ('busboy');
let File = require ('../models/File');
// need mongoose to export middleware
module.exports = function () {
  let ObjectId, gfs;
  console.log ('bgs middleware added');
  // the middleware function itself
  return function (req, res, next) {
    if (!is (req, ['multipart/form-data'])) return next ();
    if (!req.user) return res.status (401).end ();
    // the object id constructor
    ObjectId = mongoose.mongo.ObjectId;
    // create gridfs instance
    Grid.mongo = mongoose.mongo;
    gfs = Grid (mongoose.connection.db);
    // create the body object
    // all fields and files will initially be wrapped in arrays
    let body = new Map ();
    // create busboy instance
    let busboy = new Busboy ({headers: req.headers});
    // on file
    busboy.on ('file', function (fieldname, file, filename, encoding, mime) {
      // check that there is a user logged in
      // check that the array exists, if not create it
      if (!body.has (fieldname))
        body.set (fieldname, []);
      // create an id for the file
      let id = ObjectId ();
      console.log (`writing file with id ${id}`);
      // push the id to the body
      // start the stream by id and name
      let writeStream = gfs.createWriteStream ({
        _id: id,
        filename
      });
      let f = new File ({
        user: req.user._id,
        file: id,
        filename,
        mime
      });
      f.save ();
      body.get (fieldname).push (f);
      // route the data to the stream
      file.pipe (writeStream);
      // close
      file.on ('end', function () {
        writeStream.end ();
      });
    });
    // on field
    busboy.on ('field', function (fieldname, value) {
      // check that the array exists, if not create it
      if (!body.has (fieldname))
        body.set (fieldname, []);
      // add the value
      body.get (fieldname).push (value);
    });
    // finish
    busboy.on ('finish', function () {
      req.body = {};
      // deconstruct from arrays
      body.forEach ((v, k) => {
        if (v.length === 1) {
          // if there is only one element, make it a prop
          req.body [k] = v [0];
        } else {
          // otherwise pass on the array
          req.body [k] = v;
        }
      });
      // we're done, call next
      next ();
    });

    req.pipe (busboy);
  }
}

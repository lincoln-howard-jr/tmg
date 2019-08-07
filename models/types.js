const mongoose = require ('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const user = {
  type: ObjectId,
  required: true,
  ref: 'User'
}
const file = {
  type: ObjectId,
  ref: 'S3Upload'
}
const article = {
  type: ObjectId,
  ref: 'Article'
}
const election = {
  type: ObjectId,
  ref: 'Election'
}
const cause = {
  type: ObjectId,
  ref: 'Cause'
}
const reqStr = {
  type: String,
  required: true
}
const now = {
  type: Date,
  default: Date.now
}
const mdy = {
  month: {
    type: Number,
    required: true
  },
  day: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  }
}
const my = {
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  }
}
class DateRange {
  constructor (d1=new Date (), d2=new Date (), d1Name="open", d2Name="close") {
    if (d1 instanceof Date && d2 instanceof Date) {
      this.d1 = new MonthDayYear (d1);
      this.d2 = new MonthDayYear (d2);
    } else {
      this.d1 = d1;
      this.d2 = d2;
    }
    this.d1Name = d1Name;
    this.d2Name = d2Name;
  }
  contains (date) {
    return this.d1.compare (date) !== this.d2.compare (date)
  }
  toJSON () {
    return {
      [this.d1Name]: this.d1.toJSON (),
      [this.d2Name]: this.d2.toJSON ()
    }
  }
  [Symbol.iterator] () {
    let eq = this.d2.compare (this.d1);
    if (eq === 0) return {
      next: () => {
        let count = 0;
        if (!count) return {done: false, value : this.d1.toJSON ()};
        return {done: true};
      }
    }
    let curr = eq === 1 ? this.d1 : this.d2;
    let last = eq === 1 ? this.d2 : this.d1;
    return {
      next: () => {
        if (curr.compare (last) === 0) return {done: true};
        let value = curr.toJSON ();
        curr = curr.next ();
        return {done: false, value};
      }
    }
  }
}
class MonthYear {
  constructor (date=new Date ()) {
    if (date instanceof Date) {
      this.month = date.getMonth ();
      this.year = date.getFullYear ();
    } else if (date instanceof MonthDayYear) {
      this.month = date.month;
      this.year = date.year;
    } else {
      this.month = date.month;
      this.year = date.year;
    }
  }
  next () {
    return new MonthYear (new Date (this.year, this.month + 1));
  }
  compare (_my) {
    let my = new MonthYear (_my);
    if (this.year === my.year) {
      if (this.month === my.month) return 0;
      return this.month > my.month ? 1 : -1;
    } else return this.year > my.year ? 1 : -1;
  }
  toJSON () {
    return {month: this.month, year: this.year};
  }
}
class MonthDayYear {
  constructor (date=new Date ()) {
    if (date instanceof Date) {
      this.month = date.getMonth ();
      this.day = date.getDate ();
      this.year = date.getFullYear ();
    } else if (date instanceof MonthYear) {
      this.month = date.month;
      this.day = 1;
      this.year = date.year;
    } else {
      this.month = date.month;
      this.day = date.day;
      this.year = date.year;
    }
  }
  next () {
    return new MonthDayYear (new Date (this.year, this.month, this.day + 1));
  }
  compare (_mdy) {
    let mdy = new MonthDayYear (_mdy);
    if (this.year === mdy.year) {
      if (this.month === mdy.month) {
        if (this.day === mdy.day) return 0;
        return this.day > mdy.day ? 1 : -1;
      } else return this.month > mdy.month ? 1 : -1;
    } else return this.year > mdy.year ? 1 : -1;
  }
  toJSON () {
    return {month: this.month, day: this.day, year: this.year};
  }
}

module.exports = {
  mongoose,
  model: mongoose.model,
  Schema: mongoose.Schema,
  ObjectId,
  user,
  file,
  article,
  election,
  cause,
  reqStr,
  now,
  mdy,
  my,
  MonthDayYear,
  MonthYear,
  DateRange
}
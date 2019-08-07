module.exports = class DateRange {
  constructor (d1, d2) {
    if (d1 < d2) {
      this.d2 = d2;
      this.d1 = d1;
    } else {
      this.d2 = d1;
      this.d1 = d2;
    }
  }
  [Symbol.iterator] () {
    let clone = new Date (this.d1.getFullYear (), this.d1.getMonth (), this.d1.getDay ());
    let last = this.d2;
    return {
      next: () => {
        if (clone >= last) return {done: true};
        clone = new Date (clone.getFullYear (), clone.getMonth (), clone.getDate () + 1);
        return {done: false, value: new Date (clone)};
      }
    }
  }
}

class MDY {
  
}
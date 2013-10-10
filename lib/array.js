var undef;
var Readable = require('stream').Readable;
var classic = require('classic');


var ArrayStream = classic({
  constructor: function(array) {
    Readable.call(this, {objectMode: true});

    this._array = array;
    this._length = array.length;
    this._i = 0;
  },

  _read: function() {
    if (this._i < this._length) {
      var state = this._readableState;
      var next = this._array[this._i++];
      if (next === null || next === undef) {
        // the following hack is needed because we cant push 'null' or
        // 'undefined' without ending the stream. we have to trick it into
        // thinking we pushed something meaningful
        state.length += 1;
        state.buffer.push(next);
        state.reading = false;
      } else {
        this.push(next);
      }
      return;
    }

    this.push(null);
    this._done = true;
  }
}, Readable);


module.exports = function(array) {
  return new ArrayStream(array);
};

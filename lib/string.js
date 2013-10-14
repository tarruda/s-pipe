var AnythingStream = require('./anything');


// Simple stream wrapper around a string.
var StringStream = AnythingStream.extend({
  constructor: function StringStream(string) {
    // Need to set 'objectMode' to enable pushing arbitrary objects
    AnythingStream.call(this);

    this._string = string;
  },

  _read: function() {
    this.push(this._string);
    this._string = null;
    this.push(null);
  },

  _done: function() {
    return this._string === null;
  }
});


module.exports = function string(str) {
  return new StringStream(str);
};

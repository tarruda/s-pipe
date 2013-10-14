var AnythingStream = require('./anything');


// ArrayStream wraps an array-like object into a Readable stream.
// The only requirement is that the object needs have a numeric 'length'
// property.
//
// Since arrays may contain null/undefined values, it is necessary to inherit
// from the AnythingStream class
var ArrayStream = AnythingStream.extend({
  constructor: function ArrayStream(array) {
    // Need to set 'objectMode' to enable pushing arbitrary objects
    AnythingStream.call(this);

    this._array = array;
    this._length = array.length;
    this._i = 0;
  },

  _read: function() {
    this.push(this._array[this._i++]);
  },

  _done: function() {
    return this._i >= this._length;
  }
});


module.exports = function array(arr) {
  return new ArrayStream(arr);
};

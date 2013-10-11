var AnythingStream = require('./anything');


var ArrayStream = AnythingStream.extend({
  constructor: function ArrayStream(array) {
    AnythingStream.call(this, {objectMode: true});

    this._array = array;
    this._length = array.length;
    this._i = 0;
  },

  _next: function() {
    return this._array[this._i++];
  },

  _done: function() {
    return this._i >= this._length;
  }
});


module.exports = function array(arr) {
  return new ArrayStream(arr);
};

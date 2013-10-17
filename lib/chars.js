var PullStream = require('./pull');


// CharStream will split input and emit one character at a time.
var CharStream = PullStream.extend({
  constructor: function CharStream(source) {
    PullStream.call(this, source);
  },

  _process: function(chunk) {
    chunk = chunk.toString();

    for (var i = 0, l = chunk.length; i < l; i++)
      this.push(chunk.charAt(i));
  },

  _done: function() {
    return this._readableState.buffer.length === 0;
  }
});


module.exports = function chars() {
  return new CharStream(this);
};

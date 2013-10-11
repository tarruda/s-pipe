var PullStream = require('./pull');


var undef;
// ReduceStream is a port of the 'reduce' function to streams: Each chunk
// emitted is passed through a callback and the result is accumulated, starting
// with the 'start'initial value.
//
// If nothing is provided to 'start', the callback will only be called after
// the first chunk which will be used as the initial accumulator value.
//
// When the source has no more data to emit, the accumulated value is emitted
// to the next consumer.
var ReduceStream = PullStream.extend({
  constructor: function ReduceStream(source, cb, initial) {
    PullStream.call(this, source);
    this._cb = cb;
    this._current = initial;
    this._started = initial !== undef && initial !== null;
  },

  // Each chunk pulled from the source is passed through the transform
  // function.
  _pulled: function(chunk) {
    if (this._started) {
      this._current = this._cb(this._current, chunk);
    } else {
      this._current = chunk;
      this._started = true;
    }

    if (this._done()) this.push(this._current);
  }
});


module.exports = function reduce(cb, start) {
  return new ReduceStream(this, cb, start);
};

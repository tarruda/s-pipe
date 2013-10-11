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

  _pulled: function(chunk) {
    if (this._started) {
      // Pass the currently accumulated value and the chunk to the reduce
      // callback.
      this._current = this._cb(this._current, chunk);
      // When the source has no more data, emit the accumulated value to the
      // next consumer.
      if (this._done()) this._forward(this._current);
    } else {
      // This is the first chunk, use as the accumulator initial value and
      // wait for the next chunk
      this._current = chunk;
      this._started = true;
    }
  }
});


module.exports = function reduce(cb, start) {
  return new ReduceStream(this, cb, start);
};

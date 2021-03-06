var is = require('istype');
var has = require('has');

var PullStream = require('./pull');


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
    this._started = !is.nil(initial);
  },

  _process: function(chunk) {
    if (this._started) {
      // Pass the currently accumulated value and the chunk to the reduce
      // callback.
      this._current = this._cb(this._current, chunk);
      // When the source has no more data, emit the accumulated value to the
      // next consumer.
      if (this._done())
        this._ended();
    } else {
      // This is the first chunk, use as the accumulator initial value and
      // wait for the next chunk
      this._current = chunk;
      this._started = true;
    }
  },

  _ended: function() {
    if (has(this, '_current')) {
      var cur = this._current;
      delete this._current;
      if (is.func(this._preReduce))
        cur = this._preReduce(cur);
      this._forward(cur);
    }
  }

});


function reduce(cb, start) {
  return new ReduceStream(this, cb, start);
}


reduce.ReduceStream = ReduceStream;


module.exports = reduce;

var classic = require('classic');
var is = require('istype');

var PullStream = require('./pull');

var slice = Array.prototype.slice;


var Pipeline = PullStream.extend({
  constructor: function Pipeline(start, end) {
    PullStream.call(this, end);

    this._start = start;
  },

  _process: function(chunk) {
    this.push(chunk);
  },

  _write: function(chunk, encoding, callback) {
    return this._start._write(chunk, encoding, callback);
  }
});


module.exports = function spipe(stream) {
  var start = stream;
  // The 'pipeline' function returns itself until called with no
  // arguments or a false value.
  return function pipeline(fn) {
    if (arguments.length && typeof fn === 'function') {
      var args = slice.call(arguments, 1);
      stream = fn.apply(stream, args);
      return pipeline;
    }

    var eagerEvaluation = fn;

    // If 'eagerEvaluation' is true(default), we will try to eagerly evaluate
    // the entire stream by hooking into its 'data' event and buffering
    // the results into an array.
    if (is.nil(eagerEvaluation))
      eagerEvaluation = true;

    if (eagerEvaluation) {
      var buffer, tmpHandler, ended = false;
      var err;

      stream.on('error', function(e) {
        if (!err) {
          err = e;
          stream.removeAllListeners('data');
        }
      });

      stream.on('data', function(data) {
        buffer = buffer || [];
        buffer.push(data);
      });

      if (err)
        throw err;

      // If the stream is done emitting data, return the buffer
      if (stream._done && stream._done())
        return buffer || [];

      // Remove all listeners
      stream.removeAllListeners('data');
      stream.removeAllListeners('error');

      // If we consumed anything synchronously but the stream didnt complete,
      // send it back so the caller can consume it
      if (buffer) {
        while (buffer.length)
          stream.unshift(buffer.shift());
      }

      stream._readableState.flowing = false;
    }

    return new Pipeline(start, stream);
  };
};

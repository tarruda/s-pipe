var undef;
var slice = Array.prototype.slice;


module.exports = function spipe(stream) {
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
    if (eagerEvaluation === undef || eagerEvaluation === null)
      eagerEvaluation = true;

    if (eagerEvaluation) {
      var buffer, tmpHandler, ended = false;

      stream.on('data', function(data) {
        buffer = buffer || [];
        buffer.push(data);
      });

      // If the stream is done emitting data, return the buffer
      if (stream._done && stream._done())
        return buffer || [];

      // Remove all listeners
      stream.removeAllListeners('data');

      // If we consumed anything synchronously but the stream didnt complete,
      // send it back so the caller can consume it
      if (buffer.length) {
        for (var i = 0, l = buffer.length; i < l; i++)
          stream.unshift(buffer[i]);
      }

      // Put the stream in its default paused state
      stream.pause();
    }

    return stream;
  };
};

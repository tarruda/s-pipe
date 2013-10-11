var undef;
var slice = Array.prototype.slice;


module.exports = function spipe(stream) {
  // The 'pipeling' function returns itself until called with no
  // arguments(or a false value) to provide a lisp-like chaining syntax:
  //
  // ```js
  // spipe(array([1,2,3,4,5]))
  //      (filter, function(n) { return n > 3; })
  //      (map, function(n) { return n * n; })
  //      (reduce, function(result, n) { return result + n })
  //      () // returns 41
  // ```
  //
  // The last call will end the pipeline, and the return value is one of the
  // following:
  //  - If no arguments were passed, function will try to eagerly evaluate
  //    the composed stream and return an array with the results. If the array
  //    only has 1 element, that will be returned instead.
  //
  //  - If the function failed to eagerly evaluate the stream or a falsy value
  //    is passed, the composed stream will be returned as a result and may
  //    be used like any other readable stream.
  //
  // This API was designed by @mlanza in an [underscore pull request](https://github.com/jashkenas/underscore/pull/1183)
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

      // If the stream is done emitting data, return the buffer or the
      // first element if only one was emitted
      if (stream._done && stream._done())
        return buffer && buffer.length === 1 ? buffer[0] : buffer || [];

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

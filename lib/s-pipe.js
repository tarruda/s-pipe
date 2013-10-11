var undef;
var slice = Array.prototype.slice;


// This is the main API function which receives a readable stream as only
// argument. It returns a chainable function that will construct a pipeline
// of streams to produce the final result.
module.exports = function spipe(stream) {
  // The 'pipeline' function returns itself until called with no
  // arguments or a false value. This will result in a lisp-like chaining
  // syntax:
  //
  // ```js
  // spipe(array([1,2,3,4,5]))
  //      (filter, function(n) { return n > 3; })
  //      (map, function(n) { return n * n; })
  //      (reduce, function(result, n) { return result + n })
  //      (); // returns [41]
  // ```
  //
  // The last call will end the pipeline, and the return value is one of the
  // following:
  //  - If no arguments were passed, function will try to synchronously
  //    evaluate the composed stream and return an array with the results.
  //
  //  - If the stream couldn't be evaluated synchronously or a false value
  //    was passed as first argument, the composed stream will be returned as a
  //    result and may be used like any other readable stream.
  //
  // This API was designed by @mlanza in an [underscore PR](https://github.com/jashkenas/underscore/pull/1183)
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

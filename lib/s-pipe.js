var slice = Array.prototype.slice;


module.exports = function spipe(stream, forceLazyEvaluation) {
  var start = stream;

  return function pipeline(fn) {
    if (arguments.length) {
      var args = slice.call(arguments, 1);
      stream = fn.apply(stream, args);
      return pipeline;
    }

    if (!forceLazyEvaluation) {
      var buffer, tmpHandler, ended = false;

      stream.on('data', function(data) {
        buffer = buffer || [];
        buffer.push(data);
      });

      // If the stream was evaluated synchronously, return the buffer or the
      // first element if only one was emitted
      if (stream._done && stream._done())
        return buffer && buffer.length === 1 ? buffer[0] : buffer || [];

      stream.removeAllListeners('data');

      // If we consumed anything synchronously, send it back to the stream
      // buffer
      if (buffer.length) {
        for (var i = 0, l = buffer.length; i < l; i++)
          stream.unshift(buffer[i]);
      }

      // Put the stream in the paused state
      stream.pause();
    }

    return stream;
  };
};

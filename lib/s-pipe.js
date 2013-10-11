var slice = Array.prototype.slice;


module.exports = function spipe(stream, forceLazyEvaluation) {
  var start = stream;

  return function pipe(fn) {
    if (arguments.length) {
      var args = slice.call(arguments, 1);
      stream = fn.apply(stream, args);
      return pipe;
    }

    if (!forceLazyEvaluation) {
      var buffer, tmpHandler, ended = false;

      stream.on('data', function(data) {
        buffer = buffer || [];
        buffer.push(data);
      });

      if (stream._done)
        return buffer || []; // synchronous stream, return the buffer

      stream.removeAllListeners('data');

      if (buffer.length) {
        for (var i = 0, l = buffer.length; i < l; i++)
          stream.unshift(buffer[i]);
      }

      stream.pause();
    }

    return stream;
  };
};

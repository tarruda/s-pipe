var PullStream = require('./pull');


// The MapStream class is a port of the 'map' function to streams: Each chunk
// emitted is passed through a callback that performs a transformation and then
// re-emitted to the next consumer.
var MapStream = PullStream.extend({
  constructor: function MapStream(source, cb) {
    PullStream.call(this, source);
    this._cb = cb;
  },

  // Each chunk pulled from the source is passed through the transform
  // function.
  _pulled: function(chunk) {
    this.push(this._cb(chunk));
  }
});


module.exports = function map(cb) {
  return new MapStream(this, cb);
};

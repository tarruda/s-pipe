var classic = require('classic');

var PullStream = require('./pull');


// MapStreams adapts 'map' classic map function to streams: Each chunk emitted
// is passed through a transformation function and the result is re-emitted.
//
// Most of the hard work is already implemented in the PullStream superclass.
var MapStream = PullStream.extend({
  constructor: function MapStream(source, fn) {
    PullStream.call(this, source);
    this._fn = fn;
  },

  // Each chunk pulled from the source is passed through the transform
  // function.
  _pulled: function(chunk) {
    this.push(this._fn(chunk));
  }
});


module.exports = function map(fn) {
  return new MapStream(this, fn);
};

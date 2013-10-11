var classic = require('classic');

var PullStream = require('./pull');


var MapStream = PullStream.extend({
  constructor: function MapStream(source, fn) {
    PullStream.call(this, source);
    this._fn = fn;
  },

  _pulled: function(chunk) {
    this.push(this._fn(chunk));
  }
});


module.exports = function map(fn) {
  return new MapStream(this, fn);
};

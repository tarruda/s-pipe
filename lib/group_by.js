var has = require('has');

var PullStream = require('./pull');


// GroupByStream will group data emitted by its source into keys defined by the
// callback. This stream will consume the whole source stream before starting
// to emit the groups, so it should not be used with a big input
var GroupByStream = PullStream.extend({
  constructor: function GroupByStream(source, cb) {
    PullStream.call(this, source);
    this._cb = cb;
    this._groups = {};
  },

  // Each chunk pulled from the source is passed through the transform
  // function.
  _process: function(chunk) {
    var key = this._cb(chunk);

    if (!this._groups[key]) this._groups[key] = [];

    this._groups[key].push(chunk);

    if (this._done()) {
      for (var k in this._groups) {
        if (!has(this._groups, k)) continue;
        this._forward({key: k, elements: this._groups[k]});
      }
    }
  }
});


module.exports = function groupBy(cb) {
  return new GroupByStream(this, cb);
};

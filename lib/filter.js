var PullStream = require('./pull');


// The FilterStream class will simply filter chunks that match a predicate
var FilterStream = PullStream.extend({
  constructor: function FilterStream(source, cb) {
    PullStream.call(this, source);
    this._cb = cb;
  },

  _process: function(chunk) {
    if (this._cb(chunk)) this._forward(chunk);
  }
});


module.exports = function filter(cb) {
  return new FilterStream(this, cb);
};

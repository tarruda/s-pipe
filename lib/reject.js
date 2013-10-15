var PullStream = require('./pull');


// RejectStream is the opposite of the FilterStream, it only forwards chunks
// that dont match the predicate
var RejectStream = PullStream.extend({
  constructor: function RejectStream(source, cb) {
    PullStream.call(this, source);
    this._cb = cb;
  },

  _process: function(chunk) {
    if (!this._cb(chunk)) {
      this._forward(chunk);
    }
  }
});


module.exports = function reject(cb) {
  return new RejectStream(this, cb);
};

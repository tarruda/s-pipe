var PullStream = require('./pull');


// The AllStream class will emit 'true' if all chunks emitted by its source
// match the predicate, else it will emit 'false'
var AllStream = PullStream.extend({
  constructor: function AllStream(source, cb) {
    PullStream.call(this, source);
    this._cb = cb;
  },

  _process: function(chunk) {
    if (!this._cb(chunk)) {
      this.close();
      this._forward(false);
      return;
    }

    if (this._done()) this._forward(true);
  }
});


module.exports = function all(cb) {
  return new AllStream(this, cb);
};

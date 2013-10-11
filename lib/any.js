var PullStream = require('./pull');


// The AnyStream class will emit 'true' if any chunks emitted by its source
// matches the predicate, else it will emit 'false'
var AnyStream = PullStream.extend({
  constructor: function AnyStream(source, cb) {
    PullStream.call(this, source);
    this._cb = cb;
  },

  _pulled: function(chunk) {
    if (this._cb(chunk)) {
      this._forward(true);
      this.pause();
      this.close();
      return;
    }

    if (this._done()) this._forward(false);
  }
});


module.exports = function any(cb) {
  return new AnyStream(this, cb);
};

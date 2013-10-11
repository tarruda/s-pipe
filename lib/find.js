var PullStream = require('./pull');


// The FindStream class will emit the first chunk that matches a predicate,
// closing the source stream when it does
var FindStream = PullStream.extend({
  constructor: function FindStream(source, cb) {
    PullStream.call(this, source);
    this._cb = cb;
  },

  _pulled: function(chunk) {
    if (this._cb(chunk)) {
      this.push(chunk);
      this.pause();
      this.close();
    }
  }
});


module.exports = function map(cb) {
  return new FindStream(this, cb);
};

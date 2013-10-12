var PullStream = require('./pull');


// SplitStream will use the provided pattern(defaulting to newline) to
// split incoming text
var SplitStream = PullStream.extend({
  constructor: function SplitStream(source, pattern) {
    PullStream.call(this, source);
    this._pattern = pattern || /\r\n|\r|\n/;
    this._buffered = '';
  },

  // Each chunk pulled from the source is passed through the transform
  // function.
  _process: function(chunk) {
    var match, line;

    this._buffered += chunk;

    while (match = this._pattern.exec(this._buffered)) {
      line = this._buffered.slice(0, match.index);
      this._buffered = this._buffered.slice(match.index + match[0].length);
      this._forward(line);
    }
  }
});


module.exports = function split(pattern) {
  return new SplitStream(this, pattern);
};

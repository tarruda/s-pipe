var Readable = require('stream').Readable;
var classic = require('classic');


var RangeStream = classic({
  constructor: function(start, end, step) {
    if (step <= 0)
      throw new Error('Step must be a positive number');

    Readable.call(this, {objectMode: true});

    if (!end) {
      end = start;
      start = 0;
    }

    this._current = start;
    this._end = end;
    this._step = step || 1;
  },

  _read: function() {
    if (this._test()) {
      this.push(this._current);
      this._update();
      return;
    }

    this.push(null);
    this._done = true;
  }
}, Readable);


var IncreasingRangeStream = RangeStream.extend({
  _test: function() { return this._current <= this._end; },

  _update: function() { this._current += this._step; }
});


var DecreasingRangeStream = RangeStream.extend({
  _test: function() { return this._current >= this._end; },

  _update: function() { this._current -= this._step; }
});


module.exports = function(start, end, step) {
  return start < end ?
    new IncreasingRangeStream(start, end, step) : 
    new DecreasingRangeStream(start, end, step);
};

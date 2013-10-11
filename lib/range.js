var classic = require('classic');

var AnythingStream = require('./anything');


var RangeStream = AnythingStream.extend({
  constructor: function(start, end, step) {
    if (step <= 0)
      throw new Error('Step must be a positive number');

    AnythingStream.call(this);

    if (!end) {
      end = start;
      start = 0;
    }

    this._current = start;
    this._end = end;
    this._step = step || 1;
  },

  _next: function() {
    var rv = this._current;
    this._update();
    return rv;
  }
});


var IncreasingRangeStream = RangeStream.extend({
  _done: function() { return this._current > this._end; },

  _update: function() { this._current += this._step; }
});


var DecreasingRangeStream = RangeStream.extend({
  _done: function() { return this._current < this._end; },

  _update: function() { this._current -= this._step; }
});


module.exports = function range(start, end, step) {
  return start < end ?
    new IncreasingRangeStream(start, end, step) : 
    new DecreasingRangeStream(start, end, step);
};

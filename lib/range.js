var AnythingStream = require('./anything');


// RangeStream is a Readable stream that will produce a sequence of numbers
// starting from 'start', and ending at most at 'end'(no values greater than
// end can be emitted). The optional 'step' argument defaults to 1.
var RangeStream = AnythingStream.extend({
  constructor: function(start, end, step) {
    if (step <= 0)
      throw new Error('Step must be a positive number');

    // Since we are emitting numbers, 'objectMode' is required
    AnythingStream.call(this, {objectMode: true});

    // If only the 'start' argument is provided, it will be considered as
    // a range from 0 to 'start'
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
    // The '_update' method is implemented by a subclass, and will either
    // increment or decrement the value depending on the comparison of the
    // 'start' and 'end' parameters
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

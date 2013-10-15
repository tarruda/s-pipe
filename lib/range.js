var is = require('istype');

var AnythingStream = require('./anything');


// RangeStream is a Readable stream that will produce a sequence of numbers
// starting from 'start', and ending at most at 'stop'(no values greater than
// stop can be emitted). The optional 'step' argument defaults to 1.
var RangeStream = AnythingStream.extend({
  constructor: function RangeStream(start, stop, step) {
    // Since we are emitting numbers, 'objectMode' is required
    AnythingStream.call(this, {objectMode: true});

    // If only the 'start' argument is provided, it will be considered as
    // a range from 0 to 'start'
    if (is.nil(stop)) {
      stop = start;
      start = 0;
    }

    this._current = start;
    this._stop = stop;
    this._step = step || 1;
  },

  _read: function() {
    var rv = this._current;
    // The '_update' method is implemented by a subclass, and will either
    // increment or decrement the value depending on the comparison of the
    // 'start' and 'end' parameters
    this._update();
    this.push(rv);
  }
});


var IncreasingRangeStream = RangeStream.extend({
  // The constructor is only defined to improve debugging experience
  constructor: function IncreasingRangeStream(start, stop, step) {
    RangeStream.call(this, start, stop, step);
  },

  _done: function() { return this._current > this._stop; },

  _update: function() { this._current += this._step; }
});


var DecreasingRangeStream = RangeStream.extend({
  constructor: function DecreasingRangeStream(start, stop, step) {
    RangeStream.call(this, start, stop, step);
  },

  _done: function() { return this._current < this._stop; },

  _update: function() { this._current -= this._step; }
});


module.exports = function range(start, stop, step) {
  return is.nil(stop) || start < stop ?
    new IncreasingRangeStream(start, stop, step) : 
    new DecreasingRangeStream(start, stop, step);
};

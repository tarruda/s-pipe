var undef;
var Readable = require('stream').Readable;
var classic = require('classic');


// AnythingStreams are readable streams that can buffer/emit anything(including
// null and undefined values). This is done by manually modifying the
// _readableState buffer. This is a hacky but needed because the Readable
// classes ends when a null values is passed to the 'push' method.
//
// The class provides an implementation for the '_read' method. Subclasses
// need to implement the '_next' method to yield more data.
var AnythingStream = classic({
  constructor: function AnythingStream(options) {
    // Initialize readable state by invoking the superclass constructor.
    Readable.call(this, options);
  },

  _read: function() {
    // Save the readable state locally
    var state = this._readableState;
    // Get the next value
    var next = this._next();

    // If a null or undefined value is emitted, we can't pass it using
    // 'this.push' or the stream would end prematurely, instead we update the
    // internal readable state manually to trick the Readable class into
    // thinking that something meaningful was pushed.
    if (next === undef || next === null) {
      state.length += 1;
      state.buffer.push(next);
      state.reading = false;
    } else {
      // Normal values can be passed directly to the Readable class
      this.push(next);
    }

    // Since nulls and undefined values are allowed, the '_done' method is
    // implemented in by subclasses to signal that the stream has no more data.
    if (this._done()) this.push(null);
  }
}, Readable);


module.exports = AnythingStream;

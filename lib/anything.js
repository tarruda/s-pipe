var Duplex = require('stream').Duplex;
var classic = require('classic');
var is = require('istype');


// AnythingStreams are readable streams that can buffer/emit anything(including
// null and undefined values). This is done by overriding the 'push'. This is a
// hacky but needed because the Readable classes ends when a null values is
// passed to the original push method. Subclasses must implement a '_done'
// method to signal that no more data will be emitted.
//
// This is intended for internal use only.
var AnythingStream = classic({
  constructor: function AnythingStream() {
    // Initialize readable state by invoking the superclass constructor.
    Duplex.call(this, {objectMode: true});
  },

  push: function(chunk) {
    var state = this._readableState;

    state.length += 1;
    state.buffer.push(chunk);
    state.reading = false;

    if (this._done()) this._end();
  },

  // Small layer to hide event emitters from the classes in this package
  _forward: function(chunk) {
    this.emit('data', chunk);

    if (this._done()) this._end();
  },

  _end: function() {
    if (is.func(this._ended))
      this._ended();
    Duplex.prototype.push.call(this, null);
  },

  _done: function() {
    throw new Error('not implemented');
  }
}, Duplex);


module.exports = AnythingStream;

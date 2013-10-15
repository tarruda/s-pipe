var PassThrough = require('stream').PassThrough;

var classic = require('classic');

var AnythingStream = require('./anything');

function PullState(source) {
  this.source = source;
  this.started = false;
  this.ended = false;
  this.endEmitted = false;
}

// PullStream is a Readable stream that pulls, processes and forwards data from
// another Readable stream.
//
// This class is similar to the 'Transform' class, but will create a fully
// synchronous pipeline if all streams in the pipeline are synchronous
var PullStream = AnythingStream.extend({
  constructor: function PullStream(source) {
    AnythingStream.call(this);

    this._pullState = new PullState(source || new PassThrough());
  },

  _write: function(chunk, encoding, callback) {
    this._pullState.source._write(chunk, encoding, callback);
  },

  _read: function() {
    var _this = this, state = this._pullState;

    // Once this instance started pulling data, this method does nothing.  The
    // flow will be driven by 'resume/pause' which will be delegated to the
    // source stream.
    if (state.started) return;

    state.started = true;
    state.ended = false;

    // Whenever this stream is paused or resumed, forward it to the source
    this.on('pause', function() {
      state.source.pause();
    });

    this.on('resume', function() {
      state.source.resume();
    });

    // Forward all events emitted by the source
    state.source.on('close', function() {
      _this.emit('close');
    });

    state.source.on('error', function(err) {
      _this.emit('error', err);
    });

    state.source.on('end', function() {
      _this._end();
    });

    // All source's data chunks get handled by the '_process' internal method
    // implemented by subclasses, which may buffer using 'push', ignore or call
    // the '_forward' method to immediatelly forward data
    state.source.on('data', function(chunk) {
      _this._process(chunk);
    });
  },

  _done: function() {
    var state = this._pullState;

    return state.ended ||
      (state.ended = (state.source._done ? state.source._done() : false));
  },

  setEncoding: function(encoding) {
    return this._pullState.source.setEncoding(encoding);
  },

  close: function() {
    var state = this._pullState;

    this.pause();

    if (typeof state.source.close === 'function')
      state.source.close();

    state.ended = true;
  },

  destroy: function() {
    var state = this._pullState;

    this.pause();

    if (typeof state.source.destroy === 'function')
      state.source.destroy();

    state.ended = true;
  }
});


module.exports = PullStream;

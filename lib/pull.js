var Readable = require('stream').Readable;
var PassThrough = require('stream').PassThrough;

var classic = require('classic');

// PullStream is a Readable stream that pulls, processes and forwards data from
// another Readable stream.
//
// This class is similar to the 'Transform' class, but operates synchronously
// and no implicity buffering happens(it has to be handled by subclasses)
var PullStream = classic({
  constructor: function PullStream(source) {
    Readable.call(this, {objectMode: true});
    if (!source) {
      source = new PassThrough();
      this.write = function(chunk, encoding) {
        source.write(chunk, encoding);
      };
    }
    this._pullState = {started: false, source: source, ended: false};
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
    // implemented by subclasses, which may buffer, ignore or call the
    // '_forward' method to immediatelly forward data
    state.source.on('data', function(chunk) {
      _this._process(chunk);
    });
  },

  _forward: function(chunk) {
    this.emit('data', chunk);
  },

  _end: function() {
    var _this = this, state = this._pullState;

    if (!state.ended) {
      state.ended = true;
      // The 'end' event must be emitted in the next iteration, or listening to
      // it after hooking into the 'data' event from a synchronous data source
      // would have no effect
      setImmediate(function() { _this.emit('end'); });
    }
  },

  _done: function() {
    var state = this._pullState;

    return state.ended || (state.source._done ? state.source._done() : false);
  },

  setEncoding: function(encoding) {
    return this._pullState.source.setEncoding(encoding);
  },

  close: function() {
    var state = this._pullState;

    if (typeof state.source.close === 'function')
      state.source.close();

    this._end();
  },

  destroy: function() {
    var state = this._pullState;

    if (typeof state.source.destroy === 'function')
      state.source.destroy();

    this._end();
  }
}, Readable);


module.exports = PullStream;

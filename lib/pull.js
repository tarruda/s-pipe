var AnythingStream = require('./anything');


// PullStream is a Readable stream that pulls/transforms data from another
// Readable stream.
//
// Creating a PullStream from a Readable is a lot like connecting a Readable to
// a Writable through the 'pipe' method. There are a couple of differences
// though:
//
// - Pipes cannot operate synchronously(at least I couldn't do it). This means
//   it cannot cooperate with data sources that are readily available in memory
//   like Array/RangeStreams to produce immediate results
//
// - Control of the "start button" is inverted: While with a pipeline
//   the leftmost end of the pipe starts sending data, a graph of PullStreams
//   will start pulling the data from the rightmost end(thus the name).
//
// PullStreams are also AnythingStreams, that means null and undefined values
// may pass through it.
var PullStream = AnythingStream.extend({
  constructor: function PullStream(source) {
    // The objectMode is the same as the source's
    AnythingStream.call(this, {objectMode: source._readableState.objectMode});
    this._source = source;
    this._pullStarted = false;
  },

  _read: function() {
    // Once the pull has started, this method does nothing. The flow will
    // be driven by 'resume/pause' which will be delegated to the source
    // stream.
    if (this._pullStarted) return;
    var _this = this;
    this._pullStarted = true;
    this._ended = false;

    // Whenever this stream is paused or resumed, forward it to the source
    this.on('pause', function() {
      _this._source.pause();
    });

    this.on('resume', function() {
      _this._source.resume();
    });

    // Forward all events emitted by the source
    this._source.on('close', function() {
      _this.emit('close');
    });

    this._source.on('error', function(err) {
      _this.emit('error', err);
    });

    this._source.on('end', function() {
      _this._end();
    });

    // All source's data chunks get handled by the '_pulled' internal method,
    // implemented by subclasses
    this._source.on('data', function(chunk) {
      _this._pulled(chunk);
    });
  },

  _end: function() {
    var _this = this;

    if (!this._ended) {
      this._ended = true;
      // The 'end' event must be emitted in the next iteration, or listening to
      // it after hooking into the 'data' event from a synchronous data source
      // would have no effect
      setImmediate(function() { _this.emit('end'); });
    }
  },

  // This will be done when either an 'end' event was emitted by the source
  // or the source has a '_done' method and it returns true
  _done: function() {
    return this._ended || (this._source._done ? this._source._done() : false);
  },

  setEncoding: function(encoding) {
    return this._source.setEncoding(encoding);
  },

  close: function() {
    if (typeof this._source.close === 'function')
      this._source.close();
    this._end();
  }
});


module.exports = PullStream;

var AnythingStream = require('./anything');


// PullStream is a Readable stream that pulls/transforms data from another
// Readable stream.
//
// Creating a PullStream from a Readable is a lot like connecting a Readable to
// a Writable through the 'pipe' method. There are a couple of differences
// though:
//
// - Pipes cannot operate synchronously(at least I couldn't do it). This means
//   it cannot be usable with data sources that are readily available in memory
//   like arrays or ranges to produce immediate results
//
// - The 'switch' to start the flow of data is inverted: While with a pipeline
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

    // Forward all events emitted by the source
    this._source.on('data', function(chunk) {
      _this._pulled(chunk);
    });

    this._source.on('readable', function() {
      _this.emit('readable');
    });

    this._source.on('end', function() {
      _this._ended = true;
      _this.emit('end');
    });

    this._source.on('close', function() {
      _this.emit('close');
    });

    this._source.on('error', function(err) {
      _this.emit('error', err);
    });
  },
  
  // This will be done when either an 'end' event was emitted by the source
  // or the source has a '_done' method and it returns true
  _done: function() {
    return this._ended || (this._source._done ? this._source._done() : false);
  },

  resume: function() {
    return this._source.resume();
  },

  pause: function() {
    return this._source.pause();
  },

  setEncoding: function(encoding) {
    return this._source.setEncoding(encoding);
  }
});


module.exports = PullStream;

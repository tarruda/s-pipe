var AnythingStream = require('./anything');


var PullStream = AnythingStream.extend({
  constructor: function PullStream(source) {
    AnythingStream.call(this, {objectMode: source._readableState.objectMode});
    this._source = source;
    this._pullStarted = false;
  },

  _read: function() {
    if (this._pullStarted) return;
    var _this = this;
    this._pullStarted = true;

    this._source.on('data', function(chunk) {
      _this._pulled(chunk);
    });

    this._source.on('readable', function() {
      _this.emit('readable');
    });

    this._source.on('end', function() {
      _this.emit('end');
    });

    this._source.on('close', function() {
      _this.emit('close');
    });

    this._source.on('error', function() {
      _this.emit('error');
    });
  },
  
  _done: function() {
    return this._source.done();
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

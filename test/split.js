var Readable = require('stream').Readable;

var classic = require('classic');

var spipe = require('../lib/s-pipe');
var range = require('../lib/range');
var split = require('../lib/split');


var StubTextStream = classic({
  constructor: function StubTextStream() {
    Readable.call(this);
    this._async = false;
    this._chunks = [
      'Some text ',
      'that is ',
      'split\n',
      'into ',
      'newlines. ',
      'This\nchunk\r\nhas\nmany\rlines\n'
    ];
  },

  _read: function() {
    var _this = this;

    if (this._async) {
      setImmediate(function() { _this.push(_this._chunks.shift()); });
    } else {
      this.push(this._chunks.shift());
    }

    if (this._done()) this.push(null);
  },

  _done: function() { return !this._chunks.length; }
}, Readable);

runMocha({
  'SplitStream': {
    beforeEach: function() {
      this.input = new StubTextStream();
    },

    'split text synchronously': function() {
      deepEqual(spipe(this.input)(split)(), [
        'Some text that is split',
        'into newlines. This',
        'chunk',
        'has',
        'many',
        'lines'
      ]);
    },

    'lazily evaluate the stream': function(done) {
      this.input.async = true;

      var result = [];
      var stream = spipe(this.input)(split)(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [
          'Some text that is split',
          'into newlines. This',
          'chunk',
          'has',
          'many',
          'lines'
        ]);
        done();
      });
    }
  }
});

var Readable = require('stream').Readable;

var classic = require('classic');

var _ = require('../_');

var chunks = [
  'Some text ',
  'that is ',
  'split\n',
  'into ',
  'newlines. ',
  'This\nchunk\r\nhas\nmany\rlines\n'
];

var StubTextStream = classic({
  constructor: function StubTextStream() {
    Readable.call(this);
    this._chunks = chunks.slice();
  },

  _read: function() {
    var _this = this;

    setImmediate(function() { _this.push(_this._chunks.shift()); });
  }
}, Readable);

runMocha({
  'SplitStream': {
    'split text synchronously': function() {
      deepEqual(_(chunks).split().end(), [
        'Some text that is split',
        'into newlines. This',
        'chunk',
        'has',
        'many',
        'lines'
      ]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = _(new StubTextStream()).split().end();

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

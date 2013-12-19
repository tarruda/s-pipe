var _ = require('../_');
var Readable = require('stream').Readable;


function toSum(result, n) { return result + n; }
function toArray(result, n) { result.push(n); return result; }


runMocha({
  'ReduceStream': {
    'reduce values synchronously': function() {
      deepEqual(_(1, 3).reduce(toSum).end(), [6]);
    },

    'reduce values with an initial value': function() {
      deepEqual(_(1, 3).reduce(toSum, 100).end(), [106]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = _(1, 10, 3).reduce(toSum).end(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [22]);
        done();
      });
    },

    'reduce incomplete streams': function(done) {
      var source = new Readable({objectMode: true});
      source._read = function() {};

      source.push(1);
      setImmediate(function() { 
        source.push(2);
        setImmediate(function() { 
          source.push(3);
          source.push(null);
        });
      });

      _(source).reduce(toArray, []).end().on('data', function(array) {
        deepEqual([1, 2, 3], array);
        done();
      });

    }
  }
});

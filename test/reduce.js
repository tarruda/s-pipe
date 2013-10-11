var spipe = require('../lib/s-pipe');
var range = require('../lib/range');
var reduce = require('../lib/reduce');


function toSum(result, n) { return result + n; }


runMocha({
  'ReduceStream': {
    'reduce values synchronously': function() {
      deepEqual(spipe(range(1, 3))(reduce, toSum)(), 6);
    },

    'reduce values with an initial value': function() {
      deepEqual(spipe(range(1, 3))(reduce, toSum, 100)(), 106);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = spipe(range(1, 10, 3), true)(reduce, toSum)();

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [22]);
        done();
      });
    }
  }
});

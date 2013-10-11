var spipe = require('../lib/s-pipe');
var range = require('../lib/range');
var array = require('../lib/array');
var map = require('../lib/map');


function toDouble(n) { return 2 * n; }
function toPower(n) { return n * n; }


runMocha({
  'Map': {
    'transform each object synchronously': function() {
      deepEqual(spipe(range(1, 10, 3))(map, toDouble)(), [2, 8, 14, 20]);
    },

    'transform each object asynchronously': function(done) {
      var result = [];
      var stream = spipe(range(1, 10, 3), true)(map, toPower)();

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [1, 16, 49, 100]);
        done();
      });
    },
  }
});

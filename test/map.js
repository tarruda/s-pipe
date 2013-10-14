var _ = require('../_');


function toDouble(n) { return 2 * n; }
function toPower(n) { return n * n; }


runMocha({
  'Map': {
    'transform each object synchronously': function() {
      deepEqual(_(1, 10, 3).map(toDouble).end(), [2, 8, 14, 20]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = _(1, 10, 3).map(toPower).end(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [1, 16, 49, 100]);
        done();
      });
    }
  }
});

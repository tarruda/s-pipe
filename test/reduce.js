var _ = require('../_');


function toSum(result, n) { return result + n; }


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
    }
  }
});

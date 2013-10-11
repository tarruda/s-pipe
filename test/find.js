var spipe = require('../lib/s-pipe');
var range = require('../lib/range');
var find = require('../lib/find');


function predicate(n) { return n % 30 === 0; }


runMocha({
  'FindStream': {
    'find values synchronously': function() {
      deepEqual(spipe(range(1, 10000000000))(find, predicate)(), [30]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = spipe(range(1, 10000000000))(find, predicate)(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [30]);
        done();
      });
    }
  }
});

var spipe = require('../lib/s-pipe');
var range = require('../lib/range');
var filter = require('../lib/filter');


function even(n) { return n % 2 === 0; }


runMocha({
  'FilterStream': {
    'filter values synchronously': function() {
      deepEqual(spipe(range(1, 10))(filter, even)(), [2, 4, 6, 8, 10]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = spipe(range(1, 10))(filter, even)(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [2, 4, 6, 8, 10]);
        done();
      });
    }
  }
});

var spipe = require('../lib/s-pipe');
var range = require('../lib/range');
var reject = require('../lib/reject');


function even(n) { return n % 2 === 0; }


runMocha({
  'RejectStream': {
    'reject values synchronously': function() {
      deepEqual(spipe(range(1, 10))(reject, even)(), [1, 3, 5, 7, 9]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = spipe(range(1, 10))(reject, even)(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [1, 3, 5, 7, 9]);
        done();
      });
    }
  }
});

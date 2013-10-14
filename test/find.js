var _ = require('../_');


function predicate(n) { return n % 30 === 0; }


runMocha({
  'FindStream': {
    'find values synchronously': function() {
      deepEqual(_(1, 10000000000).find(predicate).end(), [30]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = _(1, 10000000000).find(predicate).end(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [30]);
        done();
      });
    }
  }
});

var _ = require('../_');


function even(n) { return n % 2 === 0; }


runMocha({
  'FilterStream': {
    'filter values synchronously': function() {
      deepEqual(_(1, 10).filter(even).end(), [2, 4, 6, 8, 10]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = _(1, 10).filter(even).end(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [2, 4, 6, 8, 10]);
        done();
      });
    }
  }
});

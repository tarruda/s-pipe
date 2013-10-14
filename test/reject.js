var _ = require('../_');


function even(n) { return n % 2 === 0; }


runMocha({
  'RejectStream': {
    'reject values synchronously': function() {
      deepEqual(_(1, 10).reject(even).end(), [1, 3, 5, 7, 9]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = _(1, 10).reject(even).end(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [1, 3, 5, 7, 9]);
        done();
      });
    }
  }
});

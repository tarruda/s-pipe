var _ = require('../_');


function areEven(n) { return n % 2 === 0; }


runMocha({
  'AllStream': {
    'test streams synchronously': function() {
      deepEqual(_(0, 1000, 2).all(areEven).end(), [true]);
    },

    "closes the source stream as soon as a chunk doesnt match": function() {
      deepEqual(_(1, 10000000000).all(areEven).end(), [false]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = _(1, 10000000000).all(areEven).end(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [false]);
        done();
      });
    }
  }
});

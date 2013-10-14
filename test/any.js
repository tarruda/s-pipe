var _ = require('../_');


function isEven(n) { return n % 2 === 0; }


runMocha({
  'AnyStream': {
    'test streams synchronously': function() {
      deepEqual(_(1, 1000, 2).any(isEven).end(), [false]);
    },

    "closes the pipeline as soon as it finds a matching chunk": function() {
      deepEqual(_(1, 10000000000).any(isEven).end(), [true]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = _(1, 10000000000).any(isEven).end(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [true]);
        done();
      });
    }
  }
});

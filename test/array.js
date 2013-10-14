var spipe = require('../lib');
var array = require('../lib/array');


runMocha({
  'ArrayStream': {
    'array': function() {
      deepEqual(spipe([1, 2, 3])(), [1, 2, 3]);
    },

    'array-like objects': function() {
      // deepEqual seems to be breaking in ie6-8 for this test
      var result = spipe(array({'0': 2, 4: 5, length: 5}))();
      equal(result[0], 2);
      equal(result[1], undefined);
      equal(result[2], undefined);
      equal(result[3], undefined);
      equal(result[4], 5);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = spipe([1, 2, 3])(false);
      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [1, 2, 3]);
        done();
      });
    }
  }
});

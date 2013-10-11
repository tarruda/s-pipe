var lispy = require('../lib/lispy');
var range = require('../lib/range');


runMocha({
  'RangeStream': {
    'returning synchronously': function() {
      equal(lispy(range(1, 1000))().length, 1000);
    },

    'increasing range': function() {
      deepEqual(lispy(range(1, 10))(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    },

    'increasing range with step': function() {
      deepEqual(lispy(range(1, 10, 3))(), [1, 4, 7, 10]);
    },

    'decreasing range': function() {
      deepEqual(lispy(range(10, 1))(), [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    },

    'decreasing range with step': function() {
      deepEqual(lispy(range(10, 1, 2))(), [10, 8, 6, 4, 2]);
    },

    'never go past the end': function() {
      deepEqual(lispy(range(1, 10, 6))(), [1, 7]);
      deepEqual(lispy(range(10, 1, 6))(), [10, 4]);
    },

    'as normal stream': function(done) {
      var result = [];
      var stream = lispy(range(1, 10, 4), true)();
      stream.on('data', function(n) {
        result.push(n);
      });
      stream.on('end', function() {
        deepEqual(result, [1, 5, 9]);
        done();
      });
    },

    'only specify first argument to create ranges from 0': function() {
      deepEqual(lispy(range(5))(), [0, 1, 2, 3, 4, 5]);
    }
  }
});

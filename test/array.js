var spipe = require('../lib/s-pipe');
var array = require('../lib/array');


runMocha({
  'ArrayStream': {
    'array': function() {
      deepEqual(spipe(array([1, 2, 3]))(), [1, 2, 3]);
    },

    'array-like objects': function() {
      var u; // undefined
      deepEqual(spipe(array({'0': 2, 4: 5, length: 5}))(), [2, u, u, u, 5]);
    },

    'as normal stream': function(done) {
      var result = [];
      var stream = spipe(array([1, 2, 3]), true)();
      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [1, 2, 3]);
        done();
      });
    }
  }
});

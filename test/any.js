var spipe = require('../lib/s-pipe');
var range = require('../lib/range');
var any = require('../lib/any');


function isEven(n) { return n % 2 === 0; }


runMocha({
  'AnyStream': {
    'test streams synchronously': function() {
      deepEqual(spipe(range(1, 1000, 2))(any, isEven)(), [false]);
    },

    "closes the pipeline as soon as it finds a matching chunk": function() {
      deepEqual(spipe(range(1, 10000000000))(any, isEven)(), [true]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = spipe(range(1, 10000000000))(any, isEven)(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [true]);
        done();
      });
    }
  }
});

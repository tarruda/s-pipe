var spipe = require('../lib/s-pipe');
var range = require('../lib/range');
var all = require('../lib/all');


function areEven(n) { return n % 2 === 0; }


runMocha({
  'AllStream': {
    'test streams synchronously': function() {
      equal(spipe(range(0, 1000, 2))(all, areEven)(), true);
    },

    "closes the source stream as soon as a chunk doesnt match": function() {
      equal(spipe(range(1, 10000000000))(all, areEven)(), false);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = spipe(range(1, 10000000000))(all, areEven)(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [false]);
        done();
      });
    }
  }
});

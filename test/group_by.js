
var spipe = require('../lib/s-pipe');
var array = require('../lib/array');
var groupBy = require('../lib/group_by');


function floor(n) { return Math.floor(n); }


runMocha({
  'GroupByStream': {
    'group values synchronously': function() {
      deepEqual(spipe(array([4.2, 6.1, 6.4]))(groupBy, floor)(), [
        {key: 4, elements: [4.2]},
        {key: 6, elements: [6.1, 6.4]}
      ]);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = spipe(array([4.2, 6.1, 6.4]))(groupBy, floor)(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, [
          {key: 4, elements: [4.2]},
          {key: 6, elements: [6.1, 6.4]}
        ]);
        done();
      });
    }
  }
});

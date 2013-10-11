var assert = require('assert');

for (var k in assert) global[k] = assert[k];

var spipe = require('../lib');
var array = require('../lib/array');
var range = require('../lib/range');
var filter = require('../lib/filter');
var find = require('../lib/find');
var map = require('../lib/map');
var reduce = require('../lib/reduce');


runMocha({
  'Chain': {
    'array -> filter -> map -> reduce': function() {
      var result =
        spipe(array([1,2,3,4,5]))
             (filter, function(n) { return n > 3; })
             (map, function(n) { return n * n; })
             (reduce, function(result, n) { return result + n; })();

      deepEqual(result, [41]);
    },

    'range -> map -> find -> map': function() {
      var result =
        spipe(range(1, 1000000000))
             (map, function(n) { return {square: n * n, number: n}; })
             (find, function(obj) { return obj.square >= 81; })
             (map, function(n) { return n.number; })();

      deepEqual(result, [9]);
    }
  }
});

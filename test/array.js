var lispy = require('../lib/lispy');
var array = require('../lib/array');


runMocha({
  'ArrayStream': {
    'array': function() {
      deepEqual(lispy(array([1, 2, 3]))(), [1, 2, 3]);
    },

    'array-like objects': function() {
      var u;
      deepEqual(lispy(array({'0': 2, 4: 5, length: 5}))(), [2, u, u, u, 5]);
    }

  }
});

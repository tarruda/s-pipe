var createChainable = require('./lib/create_chainable');


module.exports = createChainable({
  all: require('./lib/all'),
  any: require('./lib/any'),
  chars: require('./lib/chars'),
  filter: require('./lib/filter'),
  find: require('./lib/find'),
  groupBy: require('./lib/group_by'),
  map: require('./lib/map'),
  reduce: require('./lib/reduce'),
  reject: require('./lib/reject'),
  split: require('./lib/split'),
  parse: require('./lib/parse').parse
});

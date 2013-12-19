var has = require('has');
var ReduceStream = require('./reduce').ReduceStream;
var keys = require('object-keys');


// GroupByStream will group data emitted by its source into keys defined by the
// callback. This stream will consume the whole source stream before starting
// to emit the groups, so it should not be used with a big input
var GroupByStream = ReduceStream.extend({
  constructor: function GroupByStream(source, cb) {
    ReduceStream.call(this, source, function(groups, item) {
      var key = cb(item);
      if (!has(groups, key)) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  },

  _preReduce: function(reduced) {
    var k, ks = keys(reduced);

    while (ks.length > 1) {
      k = ks.shift();
      this._forward({key: k, elements: reduced[k]});
    }

    k = ks.shift();
    return {key: k, elements: reduced[k]};
  }
});


module.exports = function groupBy(cb) {
  return new GroupByStream(this, cb);
};

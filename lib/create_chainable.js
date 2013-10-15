/* jshint loopfunc: true*/
var has = require('has');
var classic = require('classic');

var spipe = require('./index');


var slice = Array.prototype.slice;


module.exports = function createChainable(functionMap) {
  return classic(function() {
    this.constructor = function Chainable() {
      var tgt = this;

      if (!(tgt instanceof Chainable))
        tgt = new Chainable();

      tgt._pipeline = spipe.apply(null, slice.call(arguments));
      return tgt;
    };
  
    for (var k in functionMap) {
      if (!has(functionMap, k)) continue;
      this[k] = (function(name, fn) {
        return function() {
          this._pipeline.apply(null, [fn].concat(slice.call(arguments)));
          return this;
        };
      })(k, functionMap[k]);
    }

    this.end = function(eager) {
      return this._pipeline(eager);
    };
  });
};

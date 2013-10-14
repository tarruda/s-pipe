var is = require('istype');

var main = require('./s-pipe');
var range = require('./range');
var array = require('./array');
var string = require('./string');

// ### s-pipe
//
// This package provides a range of utility functions with simple/nice API for
// playing with [streams](http://nodejs.org/api/stream.html). For those who
// dont know, streams are a nice node.js abstraction for handling any kind of
// IO. It also works through
// [browserify](https://github.com/substack/node-browserify).
// 
// Streams can be used to solve a great range of problems. For a introduction
// on streams, read @substack 's [stream
// handbook](https://github.com/substack/stream-handbook).
// 
// The API exposed by this module was first proposed by @mlanza in an
// [underscore PR](https://github.com/jashkenas/underscore/pull/1183) and is
// based on [lisp chaining
// syntax](http://www.lispworks.com/documentation/lw60/KW-W/html/kwprolog-w-31.htm#pgfId-889886)
// 
// ## Usage
// 
// 
// ```js
// var spipe = require('s-pipe');
// var filter = require('s-pipe/lib/filter');
// var map = require('s-pipe/lib/map');
// var reduce = require('s-pipe/lib/reduce');
// 
// spipe([1,2,3,4,5])
//      (filter, function(n) { return n > 3; })
//      (map, function(n) { return n * n; })
//      (reduce, function(result, n) { return result + n; })
//      (); // returns [41]
// ```
// Explanation:
// 
//   - The 'spipe' function accepts a single readable stream and returns a
//     chainable function. Besides a stream, spipe also accepts strings,
//     arrays or numbers(which will be treated as a range) which will all
//     be converted to streams. The chain terminates when called without a
//     function as first argument.
//   - The 'filter', 'map' and 'reduce' function are applied consecutively over
//     each other to create a composite stream.
//   - The last call without arguments ends the chain and its return value
//     depends on the stream pipeline:
//     - If the stream emitted all of its 'data' events synchronously, an array
//       containing the chunks will be returned.
//     - If a false value was passed as first argument or the stream is
//       asynchronous, the stream will be returned and may be used like any
//       other readable stream.
// 
// 
// Data is processed by each layer of the pipeline as soon as its available, no
// buffering ever happens. This opens the possibility for doing things like:
// 
// ```js
// 
// spipe(1, 1000000000) // emit 1 to 1000000000
//      (map, function(n) { return {square: n * n, number: n}; })
//      (find, function(obj) { return obj.square >= 81; })
//      (map, function(n) { return n.number; })
//      (); // [9]
// ```
// 
// As shown above, the functions are kept in separate files for optimzed builds
// with browserify.

module.exports = function spipe(start, end, by) {
  switch (is.type(start)) {
    case 'number': return main(range(start, end, by));
    case 'array': return main(array(start));
    case 'string': return main(string(start));
    default: return main(start);
  }
};


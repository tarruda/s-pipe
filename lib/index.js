module.exports = require('./s-pipe');

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
// var array = require('s-pipe/lib/array');
// var filter = require('s-pipe/lib/filter');
// var map = require('s-pipe/lib/map');
// var reduce = require('s-pipe/lib/reduce');
// 
// spipe(array([1,2,3,4,5]))
//      (filter, function(n) { return n > 3; })
//      (map, function(n) { return n * n; })
//      (reduce, function(result, n) { return result + n; })
//      (); // returns [41]
// ```
// Explanation:
// 
//   - The 'spipe' function accepts a single readable stream and returns a
//     chainable function. The chain terminates when called without a function
//     as first argument.
//   - The 'array' function creates a readable stream that emits the array
//     elements.
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
// var range = require('s-pipe/lib/range');
// 
// spipe(range(1, 1000000000))
//      (map, function(n) { return {square: n * n, number: n}; })
//      (find, function(obj) { return obj.square >= 81; })
//      (map, function(n) { return n.number; })
//      (); // [9]
// ```
// 
// The 'range' function above returns a readable stream that yields numbers
// from 1 to 1000000000. The above chain returns very fast because the pipeline
// will be closed as soon as 81 reaches the 'find' stream.
// 
// 
// As shown above, the functions are kept in separate files for optimzed builds
// with browserify.
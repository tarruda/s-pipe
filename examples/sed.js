#!/usr/bin/env node

// Simple implementation of the 'sed' unix command, it only supports basic
// versions of the 'd'(delete) and 's'(substitute) commands and only
// operates over stdio
var fs = require('fs');

var optimist = require('optimist');
var spipe = require('s-pipe');
var map = require('s-pipe/lib/map');
var reject = require('s-pipe/lib/reject');
var split = require('s-pipe/lib/split');


var argv = optimist
  .usage('Stream editor for filtering and transforming text.\n\nUsage: $0 SCRIPT* [-e SCRIPT]*')
  .alias('e', 'expression')
  .describe('e', 'Provide additional scripts to transform text')
  .argv;

var scripts = argv._;

if (argv.e)
  scripts = scripts.concat(argv.e);

if (!scripts.length) {
  optimist.showHelp();
  process.exit(1);
}

// Start the pipeline by splitting the stream into lines and wrapping each
// line into an object that contains a flag specifying if that line matched
// the pattern of the last sed command
var pipeline = spipe(process.stdin)
                    (split)
                    (map, function(line) { return {matches: true, line: line}; });


while (scripts.length) {
  var script = scripts.shift();
  
  // Sed scripts optionally start with a pattern to match the line. If no
  // pattern is given the line automatically matches.
  // 
  // If the line matches the following command will execute, eg:
  //
  // /abc/d       : Delete lines that contain the 'abc' pattern
  // /abc/s/b/c/g : On lines that matches the 'abc' pattern, substitute 'b' for 'c'
  //
  // The most common usage of sed is the substitute command on all lines(no
  // pattern specified)
  //
  // Start by parsing the pattern, command and command args of the script
  var sedScript = /^(?:\/(.+?)\/)?([sd])(.*)$/.exec(script);

  if (!sedScript) {
    console.error("Invalid sed script: ", script);
    process.exit(1);
  }

  var pattern = sedScript[1];
  var command = sedScript[2];
  var commandArgs = sedScript[3];

  if (pattern) {
    // If a pattern was given, the command will only be executed if the pattern
    // matches, so we set the flag in this layer
    (function() {
      var pat = new RegExp(pattern);
      pipeline(map, function(l) {
        l.matches = pat.test(l.line); return l; });
    })();
  } else {
    // no pattern means the command will be executed on the line, so set
    // 'matches' to true
    pipeline(map, function(l) { l.matches = true; return l; });
  }

  if (command === 'd') {
    // the delete command will simply 'reject' lines that matched the pattern
    pipeline(reject, function(l) { return l.matches; });
  } else {
    (function() {
      // parse the substitution pattern, replacement and flags
      var sub = /^\/(.+)\/(.*)\/(.*)$/.exec(commandArgs);

      if (!sub) {
        console.error("Invalid substitution pattern: s" + commandArgs);
        process.exit(1);
      }

      var subPattern = sub[1];
      var replacement = sub[2];
      var flags = sub[3];

      var pat = new RegExp(subPattern, flags);
      pipeline(map, function(l) {
        if (l.matches) l.line = l.line.replace(pat, replacement);
        return l;
      });
    })();
  }
}

// Finally pipe the result to stdout
pipeline(map, function(l) { return l.line + '\n'; })().pipe(process.stdout);

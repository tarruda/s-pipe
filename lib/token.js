var has = require('has');
var is = require('istype');
var classic = require('classic');

var PullStream = require('./pull');


function compileRule(rule, lib, cache) {
  if (has(cache, rule)) return cache[rule];

  // If rule is a regexp, extract its source
  if (has(rule, 'source')) {
    rule = rule.source;
  }

  rule = rule.toString();

  // Convert all capturing groups into non-capturing groups
  var compiled = rule.replace(/\((?!\?\:)(.+)\)/, '(?:$1)');

  // Recursively compile sub-rules 
  compiled = compiled.replace(/{{(\w+)}}/g, function(match, r) {
    var resolved = lib[r];
    if (!resolved)
      throw new Error("Cant resolve lexer rule '" + r + "'");
    return '(?:' + compileRule(resolved, lib, cache) + ')';
  });

  return cache[rule] = compiled;
}


function compile(grammar) {
  var rv = {};
  var cache = {};
  var states = grammar.states;

  for (var k in states) {
    if (!has(states, k)) continue;

    var alts = states[k];
    var components = [];

    for (var i = 0, l = alts.length; i < l; i++) {
      components.push('(' + compileRule('{{' + alts[i] + '}}', grammar.lib,
                                        cache) + ')');
    }

    rv[k] = {
      rules: alts,
      regexp: new RegExp('^(?:' + components.join('|') + ')')
    };
  }

  return rv;
}


var TokenStream = PullStream.extend({
  constructor: function TokenStream(source, grammars, factory) {
    PullStream.call(this, source);
    this._lexState = {
      stack: [grammars.start],
      grammars: grammars,
      factory: factory,
      startPos: 0,
      pos: 0,
      lineStart: 1,
      colStart: 0,
      line: 1,
      col: 0,
      buffered: '',
      text: null
    };
  },

  _currentState: function() {
    var stack = this._lexState.stack;

    return stack[stack.length - 1];
  },

  _seek: function(count) {
    var state = this._lexState, raw, lines;

    state.lineStart = state.line;
    state.colStart = state.col;
    state.startPos = state.pos;
    state.pos += count;
    raw = state.buffered.slice(state.startPos, state.pos);
    state.buffered = state.buffered.slice(count);
    lines = raw.split('\n').length - 1;
    if (lines) {
      state.line += lines;
      state.col = /\n(.*)$/.exec(raw)[1].length; 
    } else {
      state.col += raw.length;
    }
  },

  _process: function(chunk) {
    var state = this._lexState;
    var factory = state.factory;

    // join the chunk with the currently buffered text
    state.buffered += chunk;

    while (state.buffered.length) {
      var match;
      // Get the current lexer state
      var currentState = this._currentState();
      var rules = currentState.rules;
      var regexp = currentState.regexp;

      // If nothing was matched against the currently buffered data, stop
      if (!(match = regexp.exec(state.buffered)))
        break;

      // Update location info, cut the buffered string
      this._seek(match[0].length);

      // Search the rule that was matched
      for (var i = 0, l = rules.length; i < l; i++) {
        var matchIdx = i + 1;
        var rule = rules[i];
        if (match[matchIdx]) {
          state.text = match[matchIdx];
          // If a factory function was defined for a rule, invoke it
          // to produce the token
          if (has(factory, rule)) {
            var result = factory[rule](state);
            if (!is.nil(result))
              this.push(result);
          } else {
            // Else use the matched text
            this.push(state.text);
          }
          break;
        }
      }
    }
  }
});


TokenStream.extend = function(grammar) {
  var factory = grammar.factory || {};
  grammar = compile(grammar);

  return classic({
    constructor: function(source) {
      TokenStream.call(this, source, grammar, factory);
    }
  }, TokenStream);
};


module.exports = TokenStream;

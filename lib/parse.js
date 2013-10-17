var util = require('util');
var assert = require('assert');

var classic = require('classic');
var has = require('has');
var is = require('istype');

var PullStream = require('./pull');


function parseRhs(raw) {
  var match, rhs = raw, action = null;

  if (match = /[^\\]->\s*/.exec(raw)) {
    rhs = raw.slice(0, match.index).replace(/\s+$/, '');
    action = raw.slice(match.index + match[0].length).replace(/\s+$/, '');
  }

  rhs = rhs.replace(/\\->/, '->');

  return {rhs: rhs.split(/\s+/), action: action};
}


var State = classic({
  constructor: function State(builder, it) {
    var hasTransitions = false;
    var added = {};
    var items = [];

    function addItem(item) {
      if (has(added, item.ruleId)) return;
      hasTransitions = hasTransitions || item.rhs.length > item.pos;
      items.push(item);
      added[item.ruleId] = true;
      var symbol = item.rhs[item.pos];
      if (symbol && has(builder.grammar.ids, symbol)) {
        var idsForSymbol = builder.grammar.ids[symbol];

        for (var i = 0, l = idsForSymbol.length; i < l; i++) {
          var ruleId = idsForSymbol[i];
          var rule = builder.grammar.rules[ruleId];
          addItem({
            ruleId: ruleId, lhs: rule.lhs, rhs: rule.rhs,
            action: rule.action, pos: 0
          });
        }
      }
    }

    for (var i = 0, l = it.length; i < l; i++)
      addItem(it[i]);

    this.id = builder.getStateId(this, items);
    this.items = items;
    this.hasTransitions = hasTransitions;
    this.transitions = {};
    this.builder = builder;
  },

  follow: function() {
    if (!this.hasTransitions) return;

    var possibleInputs = {}, symbol;

    for (var i = 0, l = this.items.length; i < l; i++) {
      var item = this.items[i];
      symbol = item.rhs[item.pos];
      if (symbol) {
        possibleInputs[symbol] = possibleInputs[symbol] || [];
        possibleInputs[symbol].push({
          ruleId: item.ruleId, lhs: item.lhs, rhs: item.rhs,
          action: item.action, pos: item.pos + 1
        });
      }
    }

    for (symbol in possibleInputs) {
      if (!has(possibleInputs, symbol)) continue;
      var nextState;
      nextState = new State(this.builder, possibleInputs[symbol]);
      nextState.follow();
      if (has(this.transitions, symbol))
        throw new Error('Conflict!!!!');
      this.transitions[symbol] = nextState.id;
    }
  }
});

var LRTableBuilder = classic({
  constructor: function LRTableBuilder(grammar) {
    this.grammar = grammar;
    this.states = [];
    this.stateIds = {};
  },

  getStateId: function(state, items) {
    var id = [];

    for (var i = 0, l = items.length; i < l; i++) {
      var item = items[i];
      id.push(item.ruleId + ',' + item.pos);
    }
    
    id = id.join('|');

    if (!has(this.stateIds, id)) {
      this.stateIds[id] = this.states.length;
      this.states.push(state);
    }

    return this.stateIds[id];
  },

  expandGrammar: function() {
    var g = {rules: [], ids: {}};

    for (var k in this.grammar.rules) {
      if (!has(this.grammar.rules, k)) continue;
      var rule = this.grammar.rules[k];
      g.ids[k] = [];
      for (var i = 0, l = rule.length; i < l; i++) {
        var alt = rule[i];
        var rhs = parseRhs(alt);
        var id = g.rules.length + 1;
        g.rules.push({id: id, lhs: k, rhs: rhs.rhs, action: rhs.action});
        g.ids[k].push(id);
      }
    }

    // Add a helper rule to bootstrap the initial state
    g.rules.unshift({id: 0, rhs: [this.grammar.start || 'start']});

    this.grammar = g;
  },

  build: function() {
    this.expandGrammar();

    var ruleIds = this.grammar.ids[this.grammar.rules[0].rhs[0]];
    var initialItems = [];

    for (var i = 0, l = ruleIds.length; i < l; i++) {
      var ruleId = ruleIds[i];
      var rule = this.grammar.rules[ruleId];
      initialItems.push({
        ruleId: ruleId, lhs: rule.lhs, rhs: rule.rhs,
        action: rule.action, pos: 0
      });
    }

    var initialState = new State(this, initialItems);
    initialState.follow();

    // // debug
    // for (i = 0, l = this.states.length; i < l; i++) {
    //   var state = this.states[i];
    //   delete state.builder;
    // }
    // console.log(util.inspect(this.states, {depth: 7, colors: true}));
    // // debug
  }
});


var Symbol = classic({
  constructor: function Symbol(id, value) {
    this.id = id;
    this.value = value;
  }
});


var ParseStack = classic({
  constructor: function ParseStack(initialState) {
    this.symbolStack = [];
    this.stateStack = [initialState];
    this.topSymbol = null;
    this.topState = initialState;
    this.eof = false;
  },

  pushSymbol: function(symbol) {
    this.topSymbol = symbol;
    this.symbolStack.push(symbol);
  },

  popSymbols: function(count) {
    var stack = this.symbolStack;
    var slice = stack.length - count;
    var rv = stack.slice(slice);
    this.topSymbol = stack[slice - 1];
    this.symbolStack = stack.slice(0, slice);
    return rv;
  },

  pushState: function(state) {
    this.topState = state;
    this.stateStack.push(state);
  },

  popStates: function(count) {
    var stack = this.stateStack;
    var slice = stack.length - count;
    var rv = stack.slice(slice);
    this.topState = stack[slice - 1];
    this.stateStack = stack.slice(0, slice);
    return rv;
  }
});


var ParseStream = PullStream.extend({
  constructor: function ParseStream(source, grammar, factory) {
    PullStream.call(this, source);
    this._reset();
  },

  _reset: function() {
    this._parseStack = new ParseStack(this.table[0]);
  },

  _getExpecting: function(expectedTransitions) {
    var table = this.table;
    var rv = [];

    for (var k in expectedTransitions) {
      if (!has(expectedTransitions, k)) continue;
      var target = expectedTransitions[k];

      if (table[target].items.length === 1 &&
          has(expectedTransitions, table[target].items[0].lhs))
        // The only production of this symbol it already on the expected
        // transitions, ignore it
        continue;

      rv.push(k);
    }

    return rv.sort(function(a, b) {
      // Sort so 'EOF' tokens get shown last
      if (a === 'EOF') return 1;
      if (b === 'EOF') return -1;
      if (a > b) return 1;
      if (b > a) return -1;
      return 0;
    });
  },

  _formatUnexpected: function(unexpected) {
    return "Unexpected '" + unexpected + "'";
  },

  _formatExpecting: function(expected) {
    if (expected.length > 1) {
      var items = [];

      for (var i = 0, l = expected.length; i < l; i++)
      items.push("'" + expected[i] + "'");

      return 'Expecting ' + items.join(' or ');
    }

    return "Expecting '" + expected[0] + "'";
  },

  _formatUnexpectedError: function(unexpected, expecting) {
    return this._formatUnexpected(unexpected) + '. ' +
      this._formatExpecting(expecting);
  },

  _unexpectedError: function(unexpected, transitions) {
    var msg = this._formatUnexpectedError(unexpected,
                                          this._getExpecting(transitions));
    return new Error(msg);
  },

  _process: function(chunk) {
    var stack = this._parseStack, table = this.table, err;
    var state = stack.topState;

    var token = this._getToken(chunk);

    if (!has(state.transitions, token)) {
      err = this._unexpectedError(chunk, state.transitions);
      if (err)
        this.emit('error', err);
      return;
    }

    // shift and go to next state
    stack.pushSymbol(new Symbol(token, chunk));
    stack.pushState(table[state.transitions[token]]);
    state = stack.topState;

    while (state && !state.hasTransitions) {
      assert(state.items.length === 1);
      // reduce the n top items, where n is the number of elements
      // in the rhs of the only item in the current state
      var parsed;
      var item = state.items[0];
      var popped = stack.popSymbols(item.rhs.length);
      if (popped.length === 1) {
        parsed = popped[0].value;
      } else {
        parsed = [];
        for (var i = 0, l = popped.length; i < l; i++) {
          var p = popped[i];
          parsed.push(p.value);
        }
      }
      stack.popStates(item.rhs.length);
      stack.pushSymbol(new Symbol(item.lhs, parsed));
      state = stack.topState || table[0];
      stack.pushState(table[state.transitions[item.lhs]]);
      state = stack.topState;
    }

    if (state && this._done()) {
      this._process('EOF');
      this.push(stack.popSymbols(1)[0].value);
      assert(!stack.topSymbol);
    }
  },

  _getToken: function(chunk) {
    return chunk;
  }
});


ParseStream.extend = function(proto) {
  var rv = classic(proto, ParseStream);
  var builder = new LRTableBuilder(rv.prototype.grammar);
  builder.build();
  rv.prototype.table = builder.states;
  return rv;
};


module.exports = ParseStream;

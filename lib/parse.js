/* jshint loopfunc: true, latedef: false */

var util = require('util');
var assert = require('assert');

var classic = require('classic');
var has = require('has');
var is = require('istype');

var PullStream = require('./pull');
var _ = require('./index');
var reject = require('./reject');


function parseRhs(raw) {
  var match, rhs = raw, action = null;

  if (match = /[^\\]->\s*/.exec(raw)) {
    rhs = raw.slice(0, match.index).replace(/\s+$/, '');
    action = raw.slice(match.index + match[0].length).replace(/\s+$/, '');
  }

  rhs = rhs.replace(/\\->/, '->');

  return {rhs: rhs.split(/\s+/), action: action};
}


function getItemId(item) {
  return item.ruleId + ',' + item.pos;
}


// Calculates a unique string id from the kernel item set of a state
function getStateId(kernel) {
  var id = [];

  for (var i = 0, l = kernel.length; i < l; i++) {
    var item = kernel[i];
    id.push(getItemId(item));
  }
  
  return id.join('|');
}


// Retrieves the unique id for a string symbol in the grammar. The id will
// be generated if needed.
function getSymbolId(symbol, symbols, symbolIds) {
  if (!has(symbolIds, symbol)) {
    symbolIds[symbol] = symbols.length;
    symbols.push(symbol);
  }

  return symbolIds[symbol];
}

// Expands the grammar by replacing all string symbols by unique token
// ids and 'flattening' the productions of all rules. Tables for
// string <-> tokenId translation will also be created, and those will be used
// when translating input symbols into token ids or generating error messages.
function expandGrammar(grammar) {
  var rules = [], ruleIds = {}, symbols = [], symbolIds = {};
  var rv = {
    rules: rules, ruleIds: ruleIds,
    symbols: symbols, symbolIds: symbolIds
  };
  var startRule = grammar.start || 'start';

  // Validate the grammar has defined a start rule
  if (!has(grammar.rules, startRule))
    throw new Error('Grammar has no start rule');

  for (var k in grammar.rules) {
    if (!has(grammar.rules, k)) continue;

    var rule = grammar.rules[k];
    // Get the id for the lhs of the rule
    var lhs = getSymbolId(k, symbols, symbolIds);
    // Each original rule id will map to one or more expanded rules. Save
    // the expanded rule ids here
    ruleIds[lhs] = [];

    // Expand the rules
    for (var i = 0, l = rule.length; i < l; i++) {
      // Parse the rhs string of the rule
      var tmp = parseRhs(rule[i]);
      var rhs = [];
      // Actions are also replaced by integers using the same set of ids
      // as grammar symbols
      var action = getSymbolId(tmp.action || k, symbols, symbolIds);

      // Replace each symbol in the rhs by its id
      for (var j = 0, l2 = tmp.rhs.length; j < l2; j++)
        rhs.push(getSymbolId(tmp.rhs[j], symbols, symbolIds));

      // Associate the id of expanded rule with the id of the original rule
      // the '+ 1' is because the grammar will be augmented with a new
      // initial rule
      var ruleId = rules.length + 1;
      ruleIds[lhs].push(ruleId);

      rules.push({
        id: ruleId,
        lhs: lhs,
        rhs: rhs,
        action: action
      });
    }
  }

  // Augment the grammar, -1/ represents the 'accept' special rule and -2
  // represents EOF end of input
  rules.unshift({
    id: 0,
    lhs: -1,
    rhs: [getSymbolId(startRule, symbols, symbolIds), -2]
  });

  return rv;
}


function closeItemSet(grammar, kernel) {
  var added = {};
  var rv = [];

  function addItem(item) {
    var itemId = getItemId(item);
    if (has(added, itemId)) return;

    added[itemId] = true;
    rv.push(item);
    var symbolId = item.rhs[item.pos];

    // If the symbol at the current position corresponds to a grammar rule,
    // recursively expand the rule into the itemset until only terminals
    // remain 
    if (!is.nil(symbolId) && has(grammar.ruleIds, symbolId)) {
      var ruleIdsForSymbol = grammar.ruleIds[symbolId];

      for (var i = 0, l = ruleIdsForSymbol.length; i < l; i++) {
        var ruleId = ruleIdsForSymbol[i];
        var rule = grammar.rules[ruleId];
        addItem({ruleId: ruleId, lhs: rule.lhs, rhs: rule.rhs, pos: 0});
      }
    }
  }

  for (var i = 0, l = kernel.length; i < l; i++)
    addItem(kernel[i]);

  return rv;
}


// Computes the tokens that can trigger a shift in a lookahead state
function calculateShiftSet(grammar, item) {
  var rv = {};
  var next = item.rhs[item.pos];

  if (!has(grammar.ruleIds, next)) {
    rv[next] = true;
    return rv;
  }

  var ruleIds = grammar.ruleIds[next];

  while (ruleIds.length) {
    var ruleId = ruleIds.shift();
    var rule = grammar.rules[ruleId];
    if (has(grammar.ruleIds, rule.rhs[0]))
      ruleIds = ruleIds.concat(grammar.ruleIds[rule.rhs[0]]);
    else
      rv[rule.rhs[0]] = true;
  }

  return rv;
}

// Computes the tokens that can follow a reduction
function calculateReduceSet(grammar, ruleId) {
  var rv = {};
  var symbolsFollowingRule = [];
  var nonTerminals = [grammar.rules[ruleId].lhs];

  while (nonTerminals.length) {
    var nonTerminal = nonTerminals.shift();
    for (var i = 0, l = grammar.rules.length; i < l; i++) {
      var rule = grammar.rules[i];

      if (rule.lhs === nonTerminal) continue;

      for (var j = 0, l2 = rule.rhs.length; j < l2; j++) {
        var component = rule.rhs[j];
        if (component === nonTerminal) {
          if (rule.rhs.length === j + 1) {
            // The nonterminal is the last component of this rule, so
            // anything that follows this rule can also follow the nonterminal
            nonTerminals.push(rule.lhs);
            continue;
          }
          var next = rule.rhs[j + 1];
          if (next === nonTerminal) continue;
          if (has(grammar.ruleIds, next))
            // another non terminal, push to the queue
            nonTerminals.push(next);
          else
            // terminal, add to the result set
            rv[next] = true;
          break;
        }
      }
    }
  }

  return rv;
}


function lookahead(grammar, dfa, item, reduceItem, itemSet, state) {
  // Get the tokens that should be present before going to the 'shift' state
  var shiftSet = calculateShiftSet(grammar, item);
  // Get the tokens that should be present before going to the 'reduce' state
  var reduceSet = calculateReduceSet(grammar, reduceItem.ruleId);
  // Create a new state just for the reduce item
  var reduceItemSet = [reduceItem];
  var reduceState = buildState(grammar, dfa, reduceItemSet);
  // Create new state containing all item sets in this state minus the
  // reduce item
  var shiftItemSet = _(itemSet)
                      (reject, function(item) {
                        return item === reduceItem;
                      })();
  var shiftState = buildState(grammar, dfa, shiftItemSet);
  // Create the 'lookahead' state to select one of the above states
  state.action = {
    type: 'lookahead',
    shiftSet: shiftSet,
    reduceSet: reduceSet,
    consequent: shiftState.id,
    alternate: reduceState.id
  };

  return state;
}

function buildState(grammar, dfa, kernel) {
  var stateId = getStateId(kernel);
  var itemSet = closeItemSet(grammar, kernel);
  var nextKernels = {};
  var state = {id: null, action: null}, action, i, l, reduceItem;

  // Add the state to the states array and associate its index with the state
  // string id to avoid re-calculating the state later.
  state.id = dfa.stateIds[stateId] = dfa.states.length;
  dfa.states.push(state);

  // Calculate the current state action, kernels for possible follow-up states
  // and check for conflicts along the way
  for (i = 0, l = itemSet.length; i < l; i++) {
    var item = itemSet[i];

    if (item.rhs.length > item.pos) {
      // shift action
      if (!action) {
        action = {type: 'shift'};
      } else if (action.type === 'reduce') {
        return lookahead(grammar, dfa, item, reduceItem, itemSet, state);
      }
      // Add to the set of possible inputs
      var symbol = item.rhs[item.pos];
      nextKernels[symbol] = nextKernels[symbol] || [];
      nextKernels[symbol].push({
        ruleId: item.ruleId, lhs: item.lhs, rhs: item.rhs, pos: item.pos + 1
      });
    } else {
      reduceItem = item;
      // reduce by rule
      if (action) {
        if (action.type !== 'reduce')
          // shift/reduce conflict
          return lookahead(grammar, dfa, item.ruleId, item, itemSet, state);
        if (action.by !== item.ruleId)
          throw new Error('Reduce/Reduce conflict!');
      } else {
        action = {type: 'reduce', by: item.ruleId};
      }
    }
  }

  state.action = action;
  // If the action is a 'shift', calculate its transitions based
  // on the kernels for possible inputs in the current state, also follow
  // and recursively create new states if necessary
  if (action.type === 'shift') {
    var transitions = state.transitions = {};
    for (var inputSymbol in nextKernels) {
      if (!has(nextKernels, inputSymbol)) continue;

      var nextKernel = nextKernels[inputSymbol];
      var nextStateId = getStateId(nextKernel);
      var nextState;

      if (!has(dfa.stateIds, nextStateId)) {
        nextState = buildState(grammar, dfa, nextKernel);
        transitions[inputSymbol] = nextState.id;
      } else {
        transitions[inputSymbol] = dfa.stateIds[nextStateId];
      }
    }
  }

  return state;
}


function buildDfa(grammar) {
  grammar = expandGrammar(grammar);
  var rules = grammar.rules;
  var rv = {
    rules: rules,
    states: [],
    stateIds: {},
    symbols: grammar.symbols,
    symbolIds: grammar.symbolIds
  };

  var startKernel =
    [{ruleId: 0, lhs: rules[0].lhs, rhs: rules[0].rhs, pos: 0}];
  // var startRuleIds = grammar.ruleIds[grammar.rules[0].rhs[0]];
  // var startKernel = [];

  // for (var i = 0, l = startRuleIds.length; i < l; i++) {
  //   var ruleId = startRuleIds[i];
  //   var rule = grammar.rules[ruleId];
  //   startKernel.push({ruleId: ruleId, lhs: rule.lhs, rhs: rule.rhs, pos: 0});
  // }

  buildState(grammar, rv, startKernel);

  return rv;
}


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
    this._parseStack = new ParseStack(this.dfa.states[0]);
  },

  _getExpecting: function(expectedTransitions) {
    var dfa = this.dfa, states = dfa.states, rules = dfa.rules;
    var symbols = dfa.symbols;
    var rv = [];

    for (var k in expectedTransitions) {
      if (!has(expectedTransitions, k)) continue;
      var target = expectedTransitions[k];
      var state = states[target];

      if (state.action.type === 'reduce' &&
          has(expectedTransitions, rules[state.action.by].lhs))
        // The only production of this symbol it already on the expected
        // transitions, ignore it
        continue;

      rv.push(symbols[k]);
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

  _emitError: function(chunk, transitions) {
    var err = this._unexpectedError(chunk, transitions);
    if (err)
      this.emit('error', err);
    return;
  },

  _processToken: function(token, chunk) {
    var stack = this._parseStack, dfa = this.dfa, states = dfa.states;
    var rules = dfa.rules, state = stack.topState, pending = stack.pending;
    var action = state.action, shifted = false;

    while (action.type === 'lookahead') {
      stack.popStates(1);

      if (has(action.shiftSet, token)) {
        state = states[action.consequent];
      } else if (has(action.reduceSet, token)) {
        state = states[action.alternate];
      } else {
        // Invalid token, emit error using the shift set as expected 
        return this._emitError(chunk, states[action.consequent].transitions);
      }

      stack.pushState(state);
      state = stack.topState;
      action = state.action;
    }

    if (action.type === 'shift') {
      shifted = true;
      if (!has(state.transitions, token)) {
        return this._emitError(chunk, state.transitions);
      }

      // shift and go to next state
      stack.pushSymbol(new Symbol(token, chunk));
      stack.pushState(states[state.transitions[token]]);
      state = stack.topState;
    }

    while (state && state.action.type === 'reduce') {
      // reduce the n top items, where n is the number of elements
      // in the rhs of the only item in the current state
      var rule = rules[state.action.by];
      var count = rule.rhs.length;
      var parsed;
      var popped = stack.popSymbols(count);
      if (popped.length === 1) {
        parsed = popped[0].value;
      } else {
        parsed = [];
        for (var i = 0, l = popped.length; i < l; i++) {
          var p = popped[i];
          parsed.push(p.value);
        }
      }
      stack.popStates(count);
      if (rule.lhs === -1) {
        // Accept
        this.push(parsed);
        return;
      }
      stack.pushSymbol(new Symbol(rule.lhs, parsed));
      state = stack.topState || states[0];
      stack.pushState(states[state.transitions[rule.lhs]]);
      state = stack.topState;
    }

    if (state && this._done()) {
      this._processToken(-2, 'EOF');
    }
  },

  _process: function(chunk) {
    this._processToken(this.dfa.symbolIds[this._getToken(chunk)], chunk);
  },

  _getToken: function(chunk) {
    return chunk;
  }
});

 
ParseStream.extend = function(proto) {
  var rv = classic(proto, ParseStream);
  var dfa = buildDfa(rv.prototype.grammar);
  // console.log(util.inspect(dfa, {depth: 7, colors: true}));
  // // var builder = new LRTableBuilder(rv.prototype.grammar);
  // builder.build();
  rv.prototype.dfa = dfa;
  return rv;
};


exports.ParseStream = ParseStream;

exports.parse = function parse(ParserClass) {
  return new ParserClass(this);
};

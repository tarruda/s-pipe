var util = require('util');

var classic = require('classic');
var has = require('has');
var is = require('istype');

var PullStream = require('./pull');


function translateSymbol(table, symbol) {
  var id;

  if (!(id = table.ids[symbol])) {
    id = table.symbols.length;
    table.ids[symbol] = id;
    table.symbols.push(id);
  }

  return id;
}

// Replace every symbol in the grammar by a unique integer and return the
// transformed rules with the translation table for the original symbols
function replaceSymbols(grammar) {
  var rv = {ids: {}, symbols: [], rules: []};

  for (var k in grammar.rules) {
    if (!has(grammar.rules, k)) continue;
    var rule = grammar.rules[k];
    // Translate the lhs of the rule and get a reference to the alts array
    // to be populated
    var translatedRule = rv.rules[translateSymbol(rv, k)] = [];
    // Go through each alt in the rule
    for (var i = 0, l = rule.length; i < l; i++) {
      var alt = rule[i];
      // Alts should always be arrays, so translate string alts to array alts
      if (!is.array(alt)) 
        alt = [alt];
      // Translate the alt and push to the translated rule
      var translatedAlt = [];
      for (var j = 0, l2 = alt.length; j < l2; j++) {
        translatedAlt.push(translateSymbol(rv, alt[j]));
      }
      translatedRule.push(translatedAlt);
    }
  }

  return rv;
}


var State = classic({
  constructor: function State(ruleId, pos, action) {
    this.ruleId = ruleId;
    this.pos = pos;
    this.action = action;
    this.id = ruleId + '[' + pos + ']';
    this.items = [];
    this.added = {};
    this.transitions = {};
  },

  follow: function(states, grammar) {
    var item, items, i, l;

    // First step is to complete the item set by resolving non-terminal
    // rules and adding to the item set
    if (has(grammar.rules, this.ruleId)) {
      items = grammar.rules[this.ruleId];

      for (i = 0, l = items.length; i < l; i++) {
        item = items[i];
        this.addItem(states, grammar, this.ruleId, item);
      }
    }

    // Now go over each item, and add the input at current position. If
    // the current position is non-terminal, see if that state is already
    // in the 'states' cache, if not create a new state and recursively follow
    // its paths.
    for (i = 0, l = this.items.length; i < l; i++) {
      item = this.items[i];
      var symbol = item.item[this.pos];
      if (symbol) {
        var stateSymbol, pos;

        if (has(grammar.rules, symbol)) {
          stateSymbol = symbol;
          pos = 0;
        } else {
          stateSymbol = this.ruleId;
          pos = this.pos + 1;
        }

        var state = new State(stateSymbol, pos);

        if (!states[state.id]) {
          states[state.id] = state;
          state.follow(states, grammar);
        }

        this.transitions[symbol] = state.id;
      }
    }
  },

  addItem: function(states, grammar, ruleId, raw) {
    var ia = raw.split(/\s*->\s*/), item = ia[0], action = ia[1];

    item = item.split(/\s+/);

    var currentSymbol = item[this.pos];

    if (!currentSymbol || this.added[currentSymbol]) return;

    this.added[currentSymbol] = true;

    this.items.push({item: item, ruleId: ruleId});

    if (has(grammar.rules, currentSymbol)) {
      var currentSymbolRule = grammar.rules[currentSymbol];

      // Recursiverly add each item produced by the rule
      for (var i = 0, l = currentSymbolRule.length; i < l; i++) {
        var rawRuleItem = currentSymbolRule[i];
        this.addItem(states, grammar, currentSymbol, rawRuleItem);
      }
    }
  }
});


function createTable(grammar) {
  var oldLength;
  var start = grammar.start || 'start';
  var states = {};
  var initialState = new State(start, 0, 'shift');
  states[initialState.id] = initialState;

  initialState.follow(states, grammar);

  console.log(util.inspect(states, {depth: 7, colors: true}));
}


function compile(grammar) {
  // var translatedGrammar = replaceSymbols(grammar);
  // console.log(util.inspect(translatedGrammar, {depth: 7, colors: true}));
  var parseTable = createTable(grammar);
}


var ParseStream = PullStream.extend({
  constructor: function ParseStream(source, grammar, factory) {
    PullStream.call(this, source);
  }
});


ParseStream.extend = function(proto) {
  var rv = classic(proto, ParseStream);
  rv.prototype.factory = rv.prototype.factory || {};
  rv.prototype.grammar = compile(rv.prototype.grammar);
  return rv;
};


module.exports = ParseStream;

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


function parseRhs(raw) {
  var tmp = raw.split(/\s*->\s*/), rhs = tmp[0], action = tmp[1];

  return {rhs: rhs.split(/\s+/), action: action};
}

function getStateId(states, state, items) {
  var id = [];

  for (var i = 0, l = items.length; i < l; i++) {
    var item = items[i];
    id.push(item.ruleId + ',' + item.pos);
  }
  
  id = id.join('|');

  if (!has(states.ids, id)) {
    states.ids[id] = states.length;
    states.push(state);
  }

  return states.ids[id];
}

function parseGrammar(grammar, start) {
  var rv = {rules: [], ids: {}};

  for (var k in grammar.rules) {
    if (!has(grammar.rules, k)) continue;
    var rule = grammar.rules[k];
    rv.ids[k] = [];
    for (var i = 0, l = rule.length; i < l; i++) {
      var alt = rule[i];
      var rhs = parseRhs(alt);
      var id = rv.rules.length + 1;
      rv.rules.push({id: id, lhs: k, rhs: rhs.rhs, action: rhs.action});
      rv.ids[k].push(id);
    }
  }

  // Add a helper rule to bootstrap the initial state
  rv.rules.unshift({id: 0, rhs: [start]});

  return rv;
}

var State = classic({
  constructor: function State(states, grammar, it) {
    var hasTransitions = false;
    var added = {};
    var items = [];

    function addItem(item) {
      hasTransitions = hasTransitions || item.rhs.length > item.pos;
      items.push(item);
      added[item.ruleId] = true;
      var symbol = item.rhs[item.pos];
      if (symbol && has(grammar.ids, symbol)) {
        var idsForSymbol = grammar.ids[symbol];

        for (var i = 0, l = idsForSymbol.length; i < l; i++) {
          var ruleId = idsForSymbol[i];
          var rule = grammar.rules[ruleId];
          if (has(added, ruleId)) continue;
          addItem({
            ruleId: ruleId, lhs: rule.lhs, rhs: rule.rhs,
            action: rule.action, pos: 0
          });
        }
      }
    }

    for (var i = 0, l = it.length; i < l; i++)
      addItem(it[i]);

    this.id = getStateId(states, this, items);
    this.items = items;
    this.hasTransitions = hasTransitions;
    this.transitions = {};
  },

  follow: function(states, grammar) {
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
      nextState = new State(states, grammar, possibleInputs[symbol]);
      nextState.follow(states, grammar);
      this.transitions[symbol] = nextState.id;
    }
  }
});

function compile(grammar) {
  var oldLength;
  var start = grammar.start || 'start';
  var states = [];
  states.ids = {};

  grammar = parseGrammar(grammar, start);

  var ruleIds = grammar.ids[grammar.rules[0].rhs[0]];
  var initialItems = [];

  for (var i = 0, l = ruleIds.length; i < l; i++) {
    var ruleId = ruleIds[i];
    var rule = grammar.rules[ruleId];
    initialItems.push({
      ruleId: ruleId, lhs: rule.lhs, rhs: rule.rhs,
      action: rule.action, pos: 0
    });
  }

  var initialState = new State(states, grammar, initialItems);
  initialState.follow(states, grammar);


  console.log(util.inspect(states, {depth: 7, colors: true}));
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

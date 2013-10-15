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
  constructor: function State(grammar, id, pos) {
    this.id = id;
    this.pos = pos;
    this.alts = [];
    this.added = {};

    var alts = grammar.rules[id];

    for (var i = 0, l = alts.length; i < l; i++) {
      var alt = alts[i];
      this.addAlt(grammar, alt);
    }
  },

  addAlt: function(grammar, alt) {
    if (!is.array(alt)) alt = [alt];

    this.alts.push(alt);
    var currentSymbol = alt[this.pos];

    if (has(grammar.rules, currentSymbol) && !has(this.added, currentSymbol)) {
      this.added[currentSymbol] = true;
      var currentSymbolAlt = grammar.rules[currentSymbol];

      // Recursiverly add each item produced by the rule
      for (var i = 0, l = currentSymbolAlt.length; i < l; i++) {
        this.addAlt(grammar, currentSymbolAlt[i]);
      }
    }
  }
});


function createTable(grammar) {
  var oldLength;
  var start = grammar.start || 'start';
  var states = [new State(grammar, start, 0)];

  do {
    oldLength = states.length;

  } while (oldLength !== states.length);

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

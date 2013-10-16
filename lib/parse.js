var util = require('util');

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

    // debug
    for (i = 0, l = this.states.length; i < l; i++) {
      var state = this.states[i];
      delete state.builder;
    }
    console.log(util.inspect(this.states, {depth: 7, colors: true}));
    // debug
  }
});




var ParseStream = PullStream.extend({
  constructor: function ParseStream(source, grammar, factory) {
    PullStream.call(this, source);
  }
});


ParseStream.extend = function(proto) {
  var rv = classic(proto, ParseStream);
  var builder = new LRTableBuilder(rv.prototype.grammar);
  builder.build();
  return rv;
};


module.exports = ParseStream;

var _ = require('../_');
var ParseStream = require('../lib/parse').ParseStream;

var LR0Stream = ParseStream.extend({
  grammar: {
    start: 'program',

    rules: {
      program: [
        'expression'
      ],

      expression: [
        'literal',
        'expression operator literal'
      ],

      literal: [
        'digit',
        'letter'
      ],

      digit: [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
      ],

      letter: [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
      ],

      bool: [
        'true', 'false'
      ],

      operator: [
        '+', '-'
      ]
    }
  },
});


var LR1Stream = ParseStream.extend({
  grammar: {
    rules: {
      start: [
        'expression'
      ],

      expression: [
        'if true expression',
        'if true expression else expression',
        '0'
      ],
    }
  }
});

// yacc grammar, taken from http://www.cs.man.ac.uk/~pjj/complang/g2lr.html
var LR2Stream = ParseStream.extend({
  grammar: {
    start: 'yacc',

    rules: {
      yacc: [
        'rule -> yacc1',
        'yacc rule -> yacc2'
      ],

      rule: [
        'rulebody',
        'rulebody ;'
      ],

      rulebody: [
        'RULENAME : ALT -> rulebody1',
        'rulebody | ALT -> rulebody2'
      ]
    }
  },

  actions: {
    yacc1: function(rule) {
      return {rules: [rule]};
    },

    yacc2: function(yacc, rule) {
      yacc.rules.push(rule);
      return yacc;
    },

    rule: function(rulebody) {
      return rulebody;
    },

    rulebody1: function(rulename, colon, alt) {
      return {
        name: rulename,
        alts: [1]
      };
    },
  
    rulebody2: function(rb, pipe, alt) {
      rb.alts.push(rb.alts[rb.alts.length - 1] + 1);
      return rb;
    }
  }
});



runMocha({
  'LR0Stream': {
    beforeEach: function() {
      this.p = function(str) {
        return _(str)
          .chars()
          .reject(function(c) { return (/\s/).test(c); })
          .parse(LR0Stream).end();
      };
    },

    'parse synchronously': function() {
      deepEqual(this.p('0+1+0-1+1'),
               [[[[['0', '+', '1'], '+', '0'], '-', '1'], '+', '1']]);
    },

    'syntax error 1': function() {
      var throwed = false;

      try {
        this.p('0+1*0-1+1');
      } catch (e) {
        equal(e.message, "Unexpected '*'. Expecting 'operator'");
        throwed = true;
      }

      if (!throwed)
        throw new Error('Expecting exception');
    },

    'syntax error 2': function() {
      var throwed = false;

      try {
        this.p('0+1+--1+1');
      } catch (e) {
        equal(e.message, "Unexpected '-'. Expecting 'literal'");
        throwed = true;
      }

      if (!throwed)
        throw new Error('Expecting exception');
    }
  },

  'LR1Stream': {
    beforeEach: function() {
      this.p = function(array) {
        return _(array).parse(LR1Stream).end();
      };
    },
  
    'parse synchronously': function() {
      deepEqual(this.p([
        'if', 'true',
               'if', 'true',
                     'if', 'true', '0',
                     'else', 'if', 'true', '0',
                             'else', '0']), [[
        'if', 'true', [
              'if', 'true', [
                    'if', 'true', '0',
                    'else', ['if', 'true', '0', 'else', '0']]]]]);
    },
  },

  'LR2Stream': {
    beforeEach: function() {
      this.p = function(array) {
        return _(array).parse(LR2Stream).end();
      };
    },
  
    'parse synchronously': function() {
      deepEqual(this.p([
        'RULENAME', ':', 'ALT', '|', 'ALT', ';',
        'RULENAME', ':', 'ALT',
        'RULENAME', ':', 'ALT', '|', 'ALT', '|', 'ALT'
        ]), [{
          rules: [{
            name: 'RULENAME',
            alts: [1, 2]
          }, {
            name: 'RULENAME',
            alts: [1]
          }, {
            name: 'RULENAME',
            alts: [1, 2, 3]
          }]
        }]);
    },
  }
});

var _ = require('../_');
var ParseStream = require('../lib/parse').ParseStream;

// var LR1Stream = ParseStream.extend({
//   grammar: {
//     rules: {
//       start: [
//         'expression EOF'
//       ],

//       expression: [
//         'if true expression',
//         'if true expression else expression',
//         '0'
//       ],
//     }
//   }
// });

var LR0Stream = ParseStream.extend({
  grammar: {
    start: 'program',

    rules: {
      program: [
        'expression EOF'
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
               [[[[[['0', '+', '1'], '+', '0'], '-', '1'], '+', '1'], 'EOF']]);
    },

    'syntax error 1': function() {
      var throwed = false;

      try {
        this.p('0+1*0-1+1');
      } catch (e) {
        equal(e.message, "Unexpected '*'. Expecting 'operator' or 'EOF'");
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
  }
});

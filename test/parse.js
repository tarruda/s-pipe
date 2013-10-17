var spipe = require('../lib');
var chars = require('../lib/chars');
var reject = require('../lib/reject');
var ParseStream = require('../lib/parse');

var TestParseStream = ParseStream.extend({
  grammar: {
    start: 'E',

    rules: {
      E: [
        'E operator B',
        'B'
      ],

      B: [
        '0',
        '1'
      ],

      operator: [
        '+', '-'
      ]
    }
  },
});


function parse() {
  return new TestParseStream(this);
}


runMocha({
  'TokenStream': {

    'parse synchronously': function() {
      deepEqual(spipe('0+1+0-1+1')
               (chars)
               (reject, function(c) { return (/\s/).test(c); })
               (parse)(),
               [[[[['0', '+', '1'], '+', '0'], '-', '1'], '+', '1']]);
    },

    'syntax errors': function() {
      var throwed = false;

      try {
        spipe('0+1*0-1+1')
              (chars)
              (reject, function(c) { return (/\s/).test(c); })
              (parse)();
      } catch (e) {
        equal(e.message, "Unexpected symbol '*'. Expecting 'operator'");
        throwed = true;
      }

      if (!throwed)
        throw new Error('Expecting exception');
    }
  }
});

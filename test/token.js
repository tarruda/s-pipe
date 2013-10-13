var spipe = require('../lib/s-pipe');
var TokenStream = require('../lib/token');

// Lexer for a simple expression evaluator that understands simple assignments
// and arithmetic/string expressions. Strings can be interpolated with the '#{'
// and '}' delimiters
var CalculatorTokenStream = TokenStream.extend({
  lib: {
    binDigit: /[01]/,
    octDigit: /{{binDigit}}|[2-7]/,
    decDigit: /{{octDigit}}|[89]/,
    hexDigit: /{{decDigit}}|[a-fA-F]/,
    exponent: /[eE][+-]?{{decDigit}}/,
    dot: /\./,
    space: /[ \t]+/,
    newline: /(?:\r\n|\r|\n)+/,
    base2int: /0[bB]{{binDigit}}+/,
    base8int: /0[oO]{{octDigit}}+/,
    base10int: /{{decDigit}}+{{exponent}}?/,
    base16int: /0[xX]{{hexDigit}}+/,
    dotFloat: /{{dot}}{{decDigit}}+{{exponent}}?/,
    normalFloat: /{{decDigit}}+{{dotFloat}}?/,
    float: /{{dotFloat}}|{{normalFloat}}|{{base10int}}/,
    boolean: /true|false/,
    name: /^[_$a-zA-Z\xa0-\uffff][_$a-zA-Z0-9\xa0-\uffff]*$/,
    operator: /<=|>=|[=<>+.\-*\/%&|^]/,
    stringStart: /"/
  },

  states: {
    start: [
      'space',
      'newline',
      'base2int',
      'base8int',
      'base16int',
      'float',
      'boolean',
      'name',
      'operator',
      'stringStart'
    ],
  },

  factory: {
    space: function() { /* ignore */ },
    newline: function() { /* ignore */ }
  }
});


runMocha({
  'TokenStream': {
    'lex string': function() {
      var stream = new CalculatorTokenStream();
      var result = [];
      stream.on('data', function(chunk) {
        result.push(chunk);
      });
      stream.write('5.5   0xff  true+10');
      deepEqual(result, [
        '5.5',
        '0xff',
        'true',
        '+',
        '10'
      ]);
    },
  }
});

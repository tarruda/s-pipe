var spipe = require('../lib');
var ParseStream = require('../lib/parse');

var CalculatorParseStream = ParseStream.extend({
  grammar: {
    start: 'program',

    rules: {
      program: [
        'expression'
      ],

      expression: [
        'literal',
        ['expression', 'operator', 'literal']
      ],

      literal: [
        'base2int',
        'base8int',
        'base16int',
        'float',
        'boolean'
      ]
    }
  }
});


function parse() {
  return new CalculatorParseStream(this);
}


// runMocha({
//   'TokenStream': {

//     'tokenize synchronously': function() {
//       deepEqual(spipe('5.5   0xff  true+10')(tokenize)(), [
//         '5.5',
//         '0xff',
//         'true',
//         '+',
//         '10'
//       ]);
//     },

//     'lazily evaluate the stream': function(done) {
//       var result = [];
//       var stream = spipe('5.5   0xff  true+10')(tokenize)(false);

//       stream.on('data', function(n) { result.push(n); });
//       stream.on('end', function() {
//         deepEqual(result, [
//           '5.5',
//           '0xff',
//           'true',
//           '+',
//           '10'
//         ]);
//         done();
//       });
//     }
//   }
// });

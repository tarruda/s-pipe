var spipe = require('../lib');
var ParseStream = require('../lib/parse');

var TestParseStream = ParseStream.extend({
  grammar: {
    start: 'E',

    rules: {
      E: [
        'E + B',
        'B'
      ],

      B: [
        '0',
        '1'
      ]
    }
  }
});


function parse() {
  return new TestParseStream(this);
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

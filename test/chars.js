var _ = require('../_');



runMocha({
  'CharStream': {
    'split chars synchronously': function() {
      deepEqual(_('ab\nc\nd').chars().end(), ['a', 'b', '\n', 'c', '\n', 'd']);
    },

    'lazily evaluate the stream': function(done) {
      var result = [];
      var stream = _('ab\nc\nd').chars().end(false);

      stream.on('data', function(n) { result.push(n); });
      stream.on('end', function() {
        deepEqual(result, ['a', 'b', '\n', 'c', '\n', 'd']);
        done();
      });
    }
  }
});

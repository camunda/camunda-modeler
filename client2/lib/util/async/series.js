'use strict';

module.exports = function(items, fn, done) {
  var results = [],
      remaining = items.slice();

  function series(item) {
    if (item) {
      fn(item, function(err, result) {

        if (err) {
          return done(err);
        }

        results.push(result);

        return series(remaining.shift());
      });
    } else {
      return done(null, results);
    }
  }

  series(remaining.shift());
};

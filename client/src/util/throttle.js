/**
 * Throttle function call according UI update cycle.
 *
 * @param  {Function} fn
 *
 * @return {Function} throttled fn
 */
export default function throttle(fn) {

  // noop during testing
  if (process.env.NODE_ENV === 'test') {
    return fn;
  }

  // else, ...
  var active = false;

  var lastArgs = [];
  var lastThis = undefined;

  return function(...args) {

    lastArgs = args;
    lastThis = this;

    if (active) {
      return;
    }

    active = true;

    fn.apply(lastThis, lastArgs);

    window.requestAnimationFrame(function() {
      lastArgs = lastThis = active = undefined;
    });
  };

}
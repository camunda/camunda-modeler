import {
  debounce as _debounce
} from 'min-dash';

/**
 * Debounce function call according UI update cycle.
 *
 * @param  {Function} fn
 *
 * @return {Function} debounced fn
 */
export default function debounce(fn) {

  // noop during testing
  if (process.env.NODE_ENV === 'test') {
    return fn;
  }

  return _debounce(fn, 300);
}
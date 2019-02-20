/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
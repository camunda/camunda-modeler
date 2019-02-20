/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PureComponent } from 'react';

export default class CachedComponent extends PureComponent {

  getCached() {
    return this.props.cachedState;
  }

  setCached(state) {
    this.props.setCachedState(state);
  }

}
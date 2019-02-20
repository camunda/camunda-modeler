/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class Flags {

  constructor() {
    this.data = {};
  }

  init(data) {
    this.data = data;
  }

  get(key) {
    return this.data[key];
  }

  reset = () => {
    this.data = {};
  }

}

export default new Flags();


export const DISABLE_CMMN = 'disable-cmmn';
export const DISABLE_DMN = 'disable-dmn';
export const DISABLE_ADJUST_ORIGIN = 'disable-adjust-origin';

/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Manager from 'dmn-js-shared/lib/base/Manager';

import NavigatedDrdViewer from 'dmn-js-drd/lib/NavigatedViewer';

import { is } from 'dmn-js-shared/lib/util/ModelUtil';
import { containsDi } from 'dmn-js-shared/lib/util/DiUtil';


/**
 * DRD-only viewer.
 */
export default class DrdViewer extends Manager {
  _getViewProviders() {
    return [
      {
        id: 'drd',
        constructor: NavigatedDrdViewer,
        opens(element) {
          return is(element, 'dmn:Definitions') && containsDi(element);
        }
      }
    ];
  }
}
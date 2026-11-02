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
import { Ids } from 'ids';

import NavigatedDrdViewer from 'dmn-js-drd/lib/NavigatedViewer';

import { is } from 'dmn-js-shared/lib/util/ModelUtil';


/**
 * DRD-only viewer.
 */
export default class DrdViewer extends Manager {
  _init(options) {
    super._init(options);

    this.on('import.parse.complete', event => {
      if (!event.error) {
        this._collectIds(event.definitions, event.elementsById);
      }
    });
  }

  _createModdle(options) {
    const moddle = super._createModdle(options);

    moddle.ids = new Ids([ 32, 36, 1 ]);

    return moddle;
  }

  _collectIds(definitions, elementsById) {
    const ids = definitions.$model.ids;

    ids.clear();

    for (const id in elementsById) {
      ids.claim(id, elementsById[ id ]);
    }
  }

  _getViewProviders() {
    return [
      {
        id: 'drd',
        constructor: NavigatedDrdViewer,
        opens(element) {
          return is(element, 'dmn:Definitions');
        }
      }
    ];
  }
}
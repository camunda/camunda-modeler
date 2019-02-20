/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import generateImage from '../generateImage';

var types = [
  'png',
  'jpeg'
];


describe('util - generateImage', function() {

  const svg = require('./diagram.svg');

  types.forEach(function(type) {

    it('should export <' + type + '>', function() {

      const image = generateImage(type, svg);

      expect(image).to.exist;
    });

  });

});

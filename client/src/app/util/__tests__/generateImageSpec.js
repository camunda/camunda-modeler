/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
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

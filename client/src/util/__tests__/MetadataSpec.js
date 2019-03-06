/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import MetadataSingleton from '../Metadata';

const Metadata = MetadataSingleton.__proto__.constructor;


describe('Metadata', function() {

  describe('init', function() {

    it('should properly initialize', function() {

      // given
      const metadata = new Metadata();
      const data = {
        name: 'name',
        version: 'version'
      };

      // when
      metadata.init(data);

      // then
      expect(metadata).to.have.property('name').eql(data.name);
      expect(metadata).to.have.property('version').eql(data.version);

    });

  });

});

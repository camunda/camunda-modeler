/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

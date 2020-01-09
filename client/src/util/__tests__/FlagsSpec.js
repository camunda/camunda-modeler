/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import FlagsSingleton from '../Flags';

const Flags = FlagsSingleton.__proto__.constructor;


describe('Flags', function() {

  describe('init', function() {

    it('should properly initialize', function() {

      // given
      const flags = new Flags();
      const data = {
        name: 'name'
      };

      // when
      flags.init(data);

      // then
      expect(flags.get('name')).to.eql(data.name);
      expect(flags.get('non-existing')).not.to.exist;
      expect(flags.get('non-exising', 1000)).to.eql(1000);

    });

  });

});

/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import SystemClipboard from '../SystemClipboard';

import { Backend } from '../../app/__tests__/mocks';


describe('systemClipboard', function() {

  it('#writeText', function() {

    // given
    const sendSpy = (type, opts) => {

      // then
      expect(type).to.equal('system-clipboard:write-text');

      expect(opts).to.eql(options);
    };

    const backend = new Backend({ send: sendSpy });
    const systemClipboard = new SystemClipboard(backend);

    const options = {
      text: 'foobar'
    };

    // when
    systemClipboard.writeText(options);
  });

});

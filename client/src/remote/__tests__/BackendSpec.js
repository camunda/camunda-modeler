/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Backend from '../Backend';

import {
  IpcRenderer
} from './mocks';

describe('backend', function() {

  let backend,
      ipcRenderer;

  beforeEach(function() {
    ipcRenderer = new IpcRenderer();

    backend = new Backend(ipcRenderer, 'foo');
  });


  it('should resolve if first argument is null', async function() {

    // given
    ipcRenderer.setSendResponse([ null, 'foo' ]);

    // when
    const response = await backend.send();

    // then
    expect(response).to.eql('foo');
  });


  it('should reject if first argument is NOT null', async function() {

    // given
    ipcRenderer.setSendResponse([ { message: 'err' }, 'foo' ]);

    // when
    const result = await backend.send().catch(err => {

      // then
      expect(err.message).to.eql('err');
    });

    expect(result).not.to.exist;
  });


  it('should return platform <foo>', function() {

    // when
    const platform = backend.getPlatform();

    // then
    expect(platform).to.equal('foo');
  });

});
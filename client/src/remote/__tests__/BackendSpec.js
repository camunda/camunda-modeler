/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
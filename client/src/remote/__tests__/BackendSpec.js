import Backend from '../Backend';

import {
  IpcRenderer,
  Process
} from './mocks';

describe('backend', function() {

  let backend,
      ipcRenderer,
      process;

  beforeEach(function() {
    ipcRenderer = new IpcRenderer();
    process = new Process();

    backend = new Backend(ipcRenderer, process);
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


  it('should return platform darwin', function() {

    // given
    process.setPlatform('darwin');

    // when
    const platform = backend.getPlatform();

    // then
    expect(platform).to.equal('darwin');
  });

});
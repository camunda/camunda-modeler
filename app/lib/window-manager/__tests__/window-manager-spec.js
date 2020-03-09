/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const sinon = require('sinon');

const EventEmitter = require('events');

const WindowManager = require('..');

const MockConfig = require('../../../test/helper/mock/config.js');


describe('window-manager', function() {

  describe.skip('#manage', function() {

    it('set window bounds from default config', function() {

      // given
      const config = new MockConfig(),
            window = new MockWindow({ setBounds: sinon.spy() }),
            screen = new MockScreen();

      const windowManager = new WindowManager({ config, electronScreen: screen });

      // when
      windowManager.manage(window);

      // then
      expect(window.setBounds).to.have.been.calledOnce;
      expect(window.setBounds.args).to.eql([
        [ { x: 0, y: 0, width: 800, height: 600 } ]
      ]);
    });


    it('set window bounds from saved config', function() {

      // given
      const config = new MockConfig(),
            window = new MockWindow({ setBounds: sinon.spy() }),
            screen = new MockScreen(),
            savedBounds = { x: 0, y: 0, width: 1024, height: 768 };
      config.set('window', { bounds: savedBounds });

      const windowManager = new WindowManager({ config, electronScreen: screen });

      // when
      windowManager.manage(window);

      // then
      expect(window.setBounds).to.have.been.calledOnce;
      expect(window.setBounds.args).to.eql([
        [ savedBounds ]
      ]);
    });


    it('set fullScreen from saved config', function() {

      // given
      const config = new MockConfig(),
            window = new MockWindow({ setFullScreen: sinon.spy() }),
            screen = new MockScreen();
      config.set('window', { fullScreen: true });

      const windowManager = new WindowManager({ config, electronScreen: screen });

      // when
      windowManager.manage(window);

      // then
      expect(window.setFullScreen).to.have.been.calledOnce;
      expect(window.setFullScreen.args).to.eql([
        [ true ]
      ]);
    });


    it('set maximize from saved config', function() {

      // given
      const config = new MockConfig(),
            window = new MockWindow({ maximize: sinon.spy() }),
            screen = new MockScreen();
      config.set('window', { maximize: true });

      const windowManager = new WindowManager({ config, electronScreen: screen });

      // when
      windowManager.manage(window);

      // then
      expect(window.maximize).to.have.been.calledOnce;
    });
  });


  describe('saving state', function() {

    it('save window size to config on window closed', function() {

      // given
      const config = new MockConfig(),
            window = new MockWindow(),
            screen = new MockScreen();

      const windowManager = new WindowManager({ config, electronScreen: screen });
      windowManager.manage(window);

      // when
      window.emit('closed');

      // then
      const windowConfig = config.get('window');

      expect(windowConfig).to.eql({
        bounds: {
          x: 0,
          y: 0,
          width: 800,
          height: 600
        },
        fullScreen: false,
        maximize: false
      });
    });


    it('should save updated state', function() {

      // given
      const config = new MockConfig(),
            window = new MockWindow(),
            screen = new MockScreen();

      const windowManager = new WindowManager({ config, electronScreen: screen });
      windowManager.manage(window);

      // when
      window.setBounds({ x: 0, y: 0, width: 1200, height: 1000 });
      window.emit('resize');
      window.emit('closed');

      // then
      const windowConfig = config.get('window');

      expect(windowConfig).to.eql({
        bounds: {
          x: 0,
          y: 0,
          width: 1200,
          height: 1000
        },
        fullScreen: false,
        maximize: false
      });

    });

  });
});


// helper
class MockWindow extends EventEmitter {
  constructor(overrides) {
    super();
    Object.assign(this, overrides);
  }

  setBounds(newBounds) {
    this._bounds = newBounds;
  }

  getBounds() {
    return this._bounds;
  }

  setSize() {}

  setFullScreen(enabled) {
    this._isFullScreen = enabled;
  }

  maximize() {
    this._isMaximized = true;
  }

  isFullScreen = () => !!this._isFullScreen
  isMaximized = () => !!this._isMaximized
  getBounds = () => this._bounds
}

class MockScreen {
  getAllDisplays() {
    return [ { bounds: { x: 0, y: 0, width: 1920, height: 1080 } } ];
  }
}

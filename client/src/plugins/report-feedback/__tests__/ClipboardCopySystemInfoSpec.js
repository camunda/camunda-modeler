/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { ClipboardCopySystemInfo } from '../ClipboardCopySystemInfo';

import Metadata from '../../../util/Metadata';

import { UAParser } from 'ua-parser-js';

/* global sinon */
const { spy } = sinon;


describe('<ClipboardCopySystemInfo>', function() {

  describe('#clipboardCopy', function() {

    it('should call remote/clipboard#writeText', function() {

      // given
      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy })
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({});

      // then
      expect(writeTextSpy).to.have.been.calledOnce;
    });


    it('should include version', function() {

      // given
      Metadata.init({ version: 'TEST_VERSION' });

      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy })
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ version: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Version: TEST_VERSION');
    });


    it('should not include version given disabled', function() {

      // given
      Metadata.init({ version: 'TEST_VERSION' });

      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy })
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ version: false });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.not.contain(' * Version: TEST_VERSION');
    });


    it('should include operatingSystem', function() {

      // given
      const writeTextSpy = new spy();
      const currentOSInfo = compileCurrentSystemInfoString();

      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy })
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ operatingSystem: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Operating System: ' + currentOSInfo);
    });


    it('should not include operatingSystem given disabled', function() {

      // given
      const writeTextSpy = new spy();
      const currentOSInfo = compileCurrentSystemInfoString();

      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy })
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ operatingSystem: false });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.not.contain(' * Operating System: ' + currentOSInfo);
    });


    it('should include plugins', function() {

      // given
      const writeTextSpy = new spy();
      const appPlugins = [
        { name: 'plugin1' },
        { name: 'plugin2' }
      ];
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        plugins: new PluginsMock({ appPlugins })
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ installedPlugins: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Plugins: plugin1, plugin2');
    });


    it('should include plugins without installed plugins', function() {

      // given
      const writeTextSpy = new spy();
      const appPlugins = [];
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        plugins: new PluginsMock({ appPlugins })
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ installedPlugins: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Plugins: <no plugins>');
    });


    it('should not include plugins given disabled', function() {

      // given
      const writeTextSpy = new spy();
      const appPlugins = [
        { name: 'plugin1' },
        { name: 'plugin2' }
      ];
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        plugins: new PluginsMock({ appPlugins })
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ installedPlugins: false });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.not.contain(' * Plugins: plugin1, plugin2');
    });


    it('should include executionPlatform with activeTab (BPMN)', function() {

      // given
      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        activeTab: {
          type: 'bpmn'
        }
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ executionPlatform: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Execution Platform: BPMN - Camunda 7');
    });


    it('should include executionPlatform with activeTab (Cloud BPMN)', function() {

      // given
      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        activeTab: {
          type: 'cloud-bpmn'
        }
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ executionPlatform: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Execution Platform: BPMN - Camunda 8');
    });


    it('should include executionPlatform with activeTab (DMN)', function() {

      // given
      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        activeTab: {
          type: 'dmn'
        }
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ executionPlatform: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Execution Platform: DMN - Camunda 7');
    });


    it('should include executionPlatform with activeTab (Cloud DMN)', function() {

      // given
      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        activeTab: {
          type: 'cloud-dmn'
        }
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ executionPlatform: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Execution Platform: DMN - Camunda 8');
    });


    it('should include executionPlatform with activeTab (FORM)', function() {

      // given
      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        activeTab: {
          type: 'form'
        }
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ executionPlatform: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Execution Platform: Form - Camunda 7');
    });


    it('should include executionPlatform with activeTab (Cloud FORM)', function() {

      // given
      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        activeTab: {
          type: 'cloud-form'
        }
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ executionPlatform: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Execution Platform: Form - Camunda 8');
    });


    it('should include executionPlatform without activeTab', function() {

      // given
      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy })
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ executionPlatform: true });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).to.contain(' * Execution Platform: <no active Tab or no execution platform set>');
    });


    it('should not include executionPlatform given disabled', function() {

      // given
      const writeTextSpy = new spy();
      const clipboardCopySystemInfo = setupClipboardCopySystemInfo({
        systemClipboard: new SystemClipboardMock({ writeTextSpy }),
        activeTab: {
          type: 'bpmn'
        }
      });

      // when
      clipboardCopySystemInfo.clipboardCopy({ executionPlatform: false });

      // then
      const clipboardText = writeTextSpy.args[0][0].text;
      expect(clipboardText).not.to.contain(' * Execution Platform: BPMN - Camunda Platform');
    });

  });

});

// helper /////////

function setupClipboardCopySystemInfo(props) {
  const {
    systemClipboard,
    plugins,
    activeTab
  } = props;

  return new ClipboardCopySystemInfo({
    getGlobal: function(global) {
      if (global === 'plugins') {
        return plugins || new PluginsMock();
      }
      if (global === 'systemClipboard') {
        return systemClipboard || new SystemClipboardMock();
      }
    },
    activeTab: activeTab || {}
  });
}

class SystemClipboardMock {

  constructor(options = {}) {
    this._writeTextSpy = options.writeTextSpy;
  }

  writeText(props) {
    this._writeTextSpy && this._writeTextSpy(props);
  }
}

class PluginsMock {

  constructor(options = {}) {
    this._appPlugins = options.appPlugins;
  }

  getAppPlugins() {
    return this._appPlugins;
  }

}

function compileCurrentSystemInfoString() {
  const userAgentParsed = UAParser(navigator.userAgent);
  const { cpu, os } = userAgentParsed;
  return [ os.name, os.version, cpu.architecture ].join(' ');
}

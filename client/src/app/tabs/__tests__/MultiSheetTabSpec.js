/* global sinon */

import React from 'react';

import { MultiSheetTab } from '../MultiSheetTab';

import { mount } from 'enzyme';

import {
  Cache,
  WithCachedState
} from '../../cached';

import {
  providers as defaultProviders,
  tab as defaultTab
} from './mocks';

const { spy } = sinon;


describe('<MultiSheetTab>', function() {

  it('should render', function() {
    const {
      instance
    } = renderTab();

    expect(instance).to.exist;
  });


  describe('#handleImport', function() {

    it('should import without errors', function() {

      // given
      const errorSpy = spy(),
            warningSpy = spy();

      const {
        instance
      } = renderTab({
        onError: errorSpy,
        onWarning: warningSpy
      });

      // when
      instance.handleImport();

      // then
      expect(errorSpy).not.to.have.been.called;
      expect(warningSpy).not.to.have.been.called;
    });


    it('should import with warnings', function() {

      // given
      const errorSpy = spy(),
            warningSpy = spy();

      const {
        instance
      } = renderTab({
        onError: errorSpy,
        onWarning: warningSpy
      });

      // when
      const warnings = [ 'warning', 'warning' ];

      instance.handleImport(null, warnings);

      // then
      expect(errorSpy).not.to.have.been.called;
      expect(warningSpy).to.have.been.calledTwice;
      expect(warningSpy.alwaysCalledWith('warning')).to.be.true;
    });


    it('should import with error', function() {

      // given
      const errorSpy = spy(),
            warningSpy = spy();

      const {
        instance
      } = renderTab({
        onError: errorSpy,
        onWarning: warningSpy
      });

      const showImportErrorDialogSpy = spy(instance, 'showImportErrorDialog');

      // when
      const error = new Error('error');

      instance.handleImport(error);

      // then
      expect(errorSpy).to.have.been.calledWith(error);
      expect(warningSpy).not.to.have.been.called;
      expect(showImportErrorDialogSpy).to.have.been.called;
    });

  });


  describe('#showImportErrorDialog', function() {

    it('should open', function() {

      // given
      const actionSpy = spy();

      const {
        instance
      } = renderTab({
        onAction: actionSpy
      });

      // when
      instance.showImportErrorDialog(new Error('error'));

      // then
      expect(actionSpy).to.have.been.called;
    });


    it('should open forum', async function() {

      // given
      const actionSpy = spy(action => {
        if (action === 'show-dialog') {
          return 'ask-in-forum';
        }
      });

      const {
        instance
      } = renderTab({
        onAction: actionSpy
      });

      // when
      await instance.showImportErrorDialog(new Error('error'));

      // then
      expect(actionSpy).to.have.been.calledTwice;
    });


    it('should open fallback on error', function() {

      // given
      const {
        instance
      } = renderTab();

      // when
      instance.handleImport(new Error('error'));

      // then
      const {
        activeSheet
      } = instance.getCached();

      expect(activeSheet.id).to.equal('fallback');
    });

  });


  it('#openFallback', function() {

    // given
    const {
      instance
    } = renderTab();

    // when
    instance.openFallback();

    // then
    const {
      activeSheet
    } = instance.getCached();

    expect(activeSheet.id).to.equal('fallback');
  });

});


// helpers //////////////////////////////

function noop() {}

const TestTab = WithCachedState(MultiSheetTab);

function renderTab(options = {}) {
  const {
    id,
    xml,
    tab,
    layout,
    onChanged,
    onError,
    onWarning,
    onShown,
    onLayoutChanged,
    onContextMenu,
    onAction,
    providers
  } = options;

  const withCachedState = mount(
    <TestTab
      id={ id || 'editor' }
      tab={ tab || defaultTab }
      xml={ xml }
      onChanged={ onChanged || noop }
      onError={ onError || noop }
      onWarning={ onWarning || noop }
      onShown={ onShown || noop }
      onLayoutChanged={ onLayoutChanged || noop }
      onContextMenu={ onContextMenu || noop }
      onAction={ onAction || noop }
      providers={ providers || defaultProviders }
      cache={ options.cache || new Cache() }
      layout={ layout || {
        minimap: {
          open: false
        },
        propertiesPanel: {
          open: true
        }
      } }
    />
  );

  const wrapper = withCachedState.find(MultiSheetTab);

  const instance = wrapper.instance();

  return {
    instance,
    wrapper
  };
}
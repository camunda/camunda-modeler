/* global sinon */

import React from 'react';

import { MultiSheetTab } from '../MultiSheetTab';

import { mount } from 'enzyme';

import {
  Cache,
  WithCachedState
} from '../../cached';

import {
  Editor as DefaultEditor,
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


  describe('dirty state', function() {

    let instance,
        wrapper;

    beforeEach(function() {
      const cache = new Cache();

      cache.add('editor', {
        cached: {
          lastXML: 'foo'
        }
      });

      ({ instance, wrapper } = renderTab({
        xml: 'foo',
        cache,
        providers: [{
          type: 'foo',
          editor: DefaultEditor,
          defaultName: 'Foo'
        }, {
          type: 'bar',
          editor: DefaultEditor,
          defaultName: 'Bar'
        }]
      }));
    });


    it('should NOT be dirty initially', function() {

      // when
      const dirty = instance.isDirty();

      // then
      expect(dirty).to.be.false;
    });


    it('should NOT be dirty on switch sheet', async function() {

      // given
      const { sheets } = instance.getCached();

      // make sure editor returns same XML
      wrapper.find(DefaultEditor).first().instance().setXML('foo');

      // when
      await instance.switchSheet(sheets[1]);

      // then
      expect(instance.isDirty()).to.be.false;
    });


    it('should be dirty on switch sheet', async function() {

      // given
      const { sheets } = instance.getCached();

      // make sure editor returns NOT same XML
      wrapper.find(DefaultEditor).first().instance().setXML('bar');

      // when
      await instance.switchSheet(sheets[1]);

      // then
      expect(instance.isDirty()).to.be.true;
    });

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
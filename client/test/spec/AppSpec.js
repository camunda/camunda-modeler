/* global sinon */

import React from 'react';

import { shallow } from 'enzyme';

import mitt from 'mitt';

import { Cache } from '../../src/app/cached';

import { TabLoading } from '../../src/app/App';

import BpmnTab from '../../src/app/tabs/BpmnTab';

import {
  AppComponent
} from '../../src/app/App';

function Backend() {
  this.send = function() {};
  this.on = function() {};
  this.once = function() {};
}


describe('App', function() {

  var globals;

  beforeEach(function() {
    globals = {
      eventBus: mitt(),
      backend: new Backend()
    };
  });


  it('should render', function() {

    // when
    var wrapper = shallow(<AppComponent cache={ new Cache() } globals={ globals } />);

    // then
    var instance = wrapper.instance();

    expect(instance).to.exist;
  });


  describe('tabs', function() {

    it('should initially be loading tab', function() {

      // when
      var wrapper = shallow(<AppComponent cache={ new Cache() } globals={ globals } />);

      // then
      var instance = wrapper.instance();

      expect(instance.state.Tab).to.equal(TabLoading);
    });


    it('should load tab', function() {

      // when
      var wrapper = shallow(<AppComponent cache={ new Cache() } globals={ globals } />);

      // then
      // right now there's no way of knowing when loading the tab has finished
      // setTimout will make test fail since render is beeing reset after each test
      setTimeout(function() {
        var instance = wrapper.instance();

        expect(instance.state.Tab).to.equal(BpmnTab);
      }, 1000);
    });


    it('should select tab', function() {

      // given
      var wrapper = shallow(<AppComponent cache={ new Cache() } globals={ globals } />);

      var instance = wrapper.instance();

      var bpmnTab = {
        type: 'bpmn',
        name: 'foo.bpmn',
        content: null,
        id: 'foo'
      };

      var dmnTab = {
        type: 'dmn',
        name: 'bar.dmn',
        content: null,
        id: 'dmn'
      };

      instance.setState({
        tabs: [ bpmnTab, dmnTab ],
        activeTab: bpmnTab,
        Tab: BpmnTab
      });

      // when
      instance.selectTab(dmnTab);

      // then
      expect(instance.state.activeTab).to.equal(dmnTab);
    });


    it('should close tab', function() {

      // given
      var wrapper = shallow(<AppComponent cache={ new Cache() } globals={ globals } />);

      var instance = wrapper.instance();

      var bpmnTab = {
        type: 'bpmn',
        name: 'foo.bpmn',
        content: null,
        id: 'foo'
      };

      var dmnTab = {
        type: 'dmn',
        name: 'bar.dmn',
        content: null,
        id: 'dmn'
      };

      instance.setState({
        tabs: [ bpmnTab, dmnTab ],
        activeTab: bpmnTab,
        Tab: BpmnTab
      });

      // when
      instance.closeTab(bpmnTab);

      // then
      expect(instance.state.tabs).to.have.length(1);
      expect(instance.state.activeTab).to.equal(dmnTab);
    });

  });


  describe('events', function() {

    it('should fire "app:ready"', function() {

      // given
      var eventBus = globals.eventBus;

      var spy = sinon.spy();

      eventBus.on('app:ready', spy);

      // when
      shallow(<AppComponent cache={ new Cache() } globals={ globals } />);

      // then
      expect(spy).to.have.been.called;
    });

  });

});
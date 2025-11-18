/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import { mount } from 'enzyme';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';
import { Overlay } from '../../../shared/ui';

import { TabsProvider } from '../../../app/__tests__/mocks';

import ProcessApplicationsStatusBar from '../ProcessApplicationsStatusBar';

describe('<ProcessApplicationsStatusBar>', function() {

  it('should render', function() {
    createProcessApplicationsStatusBar();
  });


  it('should open overlay on click', function() {

    // given
    const { wrapper } = createProcessApplicationsStatusBar();

    // when
    wrapper.find('.btn').simulate('click');

    // then
    expect(wrapper.find(Overlay)).to.have.length(1);
  });


  it('should close overlay on click', function() {

    // given
    const { wrapper } = createProcessApplicationsStatusBar();

    // when
    wrapper.find('.btn').simulate('click');

    // then
    expect(wrapper.find(Overlay)).to.have.length(1);

    // when
    wrapper.find('.btn').simulate('click');

    // then
    expect(wrapper.find(Overlay)).to.have.length(0);
  });


  describe('<Overlay>', function() {

    it('should render name of process application file', function() {

      // when
      const wrapper = createProcessApplicationsStatusBar().wrapper;

      wrapper.find('.btn').simulate('click');

      // then
      expect(wrapper.find('.process-application-file .file')).to.have.length(1);
      expect(wrapper.find('.process-application-file .file').at(0).text()).to.eql('.process-application');
    });


    it('should reveal process application file in file explorer on click', function() {

      // given
      const revealInFileExplorerSpy = sinon.spy();

      const wrapper = createProcessApplicationsStatusBar({
        onRevealInFileExplorer: revealInFileExplorerSpy
      }).wrapper;

      wrapper.find('.btn').simulate('click');

      // when
      wrapper.find('.process-application-file .file').at(0).find('button').simulate('click');

      // then
      expect(revealInFileExplorerSpy).to.have.been.calledOnceWith('C://process-application/.process-application');
    });


    it('should render names process application files sorted', function() {

      // when
      const wrapper = createProcessApplicationsStatusBar().wrapper;

      wrapper.find('.btn').simulate('click');

      // then
      expect(wrapper.find('.process-application-files .file')).to.have.length(3);
      expect(wrapper.find('.process-application-files .file').at(0).text()).to.eql('foo.bpmn');
      expect(wrapper.find('.process-application-files .file').at(1).text()).to.eql('bar.dmn');
      expect(wrapper.find('.process-application-files .file').at(2).text()).to.eql('baz.form');
    });


    it('should open process application file on click', function() {

      // given
      const onOpenSpy = sinon.spy();

      const wrapper = createProcessApplicationsStatusBar({
        onOpen: onOpenSpy
      }).wrapper;

      wrapper.find('.btn').simulate('click');

      // when
      wrapper.find('.process-application-files .file').at(0).find('button').simulate('click');

      // then
      expect(onOpenSpy).to.have.been.calledOnceWith('C://process-application/foo.bpmn');
    });


    it('should render names of files with error messages sorted', function() {

      // given
      const processApplicationItems = [
        ...DEFAULT_PROCESS_APPLICATION_ITEMS,
        PROCESS_APPLICATION_ITEM_ERROR
      ];

      // when
      const { wrapper } = createProcessApplicationsStatusBar({
        processApplicationItems
      });

      wrapper.find('.btn').simulate('click');

      // then
      expect(wrapper.find('.process-application-files .file')).to.have.length(4);
      expect(wrapper.find('.process-application-files .file').at(3).text()).to.eql('error.bpmn');
    });


    it('should not open process application file with error message on click', function() {

      // given
      const onOpenSpy = sinon.spy();

      const processApplicationItems = [
        ...DEFAULT_PROCESS_APPLICATION_ITEMS,
        PROCESS_APPLICATION_ITEM_ERROR
      ];

      const { wrapper } = createProcessApplicationsStatusBar({
        onOpen: onOpenSpy,
        processApplicationItems
      });

      wrapper.find('.btn').simulate('click');

      // when
      wrapper.find('.process-application-files .file').at(3).find('button').simulate('click');

      // then
      expect(onOpenSpy).not.to.have.been.called;
    });

  });

});

const DEFAULT_OPEN_TAB = {
  file: {
    path: 'diagram_1.bpmn'
  }
};

const DEFAULT_PROCESS_APPLICATION = {
  file: {
    name: '.process-application',
    uri: 'file:///C:/process-application/.process-application',
    path: 'C://process-application/.process-application',
    dirname: 'C://process-application',
    contents: '{}'
  },
  metadata: {
    type: 'processApplication'
  }
};

const DEFAULT_PROCESS_APPLICATION_ITEMS = [
  {
    file: {
      name: 'foo.bpmn',
      uri: 'file:///C:/process-application/foo.bpmn',
      path: 'C://process-application/foo.bpmn',
      dirname: 'C://process-application',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      type: 'bpmn'
    }
  },
  {
    file: {
      name: 'bar.dmn',
      uri: 'file:///C:/process-application/bar.dmn',
      path: 'C://process-application/bar.dmn',
      dirname: 'C://process-application',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      type: 'dmn'
    }
  },
  {
    file: {
      name: 'baz.form',
      uri: 'file:///C:/process-application/baz.form',
      path: 'C://process-application/baz.form',
      dirname: 'C://process-application',
      contents: '{}'
    },
    metadata: {
      type: 'form'
    }
  },
  DEFAULT_PROCESS_APPLICATION
];

const PROCESS_APPLICATION_ITEM_ERROR = {
  file: {
    name: 'error.bpmn',
    uri: 'file:///C:/process-application/error.bpmn',
    path: 'C://process-application/error.bpmn',
    dirname: 'C://process-application',
    contents: '<',
    messages: [
      {
        error: true,
        message: 'Error',
        source: 'process-error'
      }
    ]
  }
};

function createProcessApplicationsStatusBar(props = {}, render = mount) {
  const {
    activeTab = DEFAULT_OPEN_TAB,
    onOpen = () => {},
    onRevealInFileExplorer = () => {},
    processApplication = DEFAULT_PROCESS_APPLICATION,
    processApplicationItems = DEFAULT_PROCESS_APPLICATION_ITEMS,
    tabsProvider = new TabsProvider(activeTab)
  } = props;

  const wrapper = render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <ProcessApplicationsStatusBar
      activeTab={ activeTab }
      onOpen={ onOpen }
      onRevealInFileExplorer={ onRevealInFileExplorer }
      processApplication={ processApplication }
      processApplicationItems={ processApplicationItems }
      tabsProvider={ tabsProvider }
      { ...props }
    />
  </SlotFillRoot>);

  const instance = wrapper.instance();

  return { wrapper, instance };
}
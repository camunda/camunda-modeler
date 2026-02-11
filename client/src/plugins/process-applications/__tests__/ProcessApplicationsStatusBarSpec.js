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

import { render, fireEvent, screen } from '@testing-library/react';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';

import { TabsProvider } from '../../../app/__tests__/mocks';

import ProcessApplicationsStatusBar from '../ProcessApplicationsStatusBar';

describe('<ProcessApplicationsStatusBar>', function() {

  describe('process application', function() {

    it('should render and indicate process application', function() {

      // when
      createProcessApplicationsStatusBar();

      // then
      const button = screen.getByRole('button');
      expect(button).to.exist;
      expect(button.classList.contains('has-process-application')).to.be.true;
    });


    it('should open overlay on click', function() {

      // given
      createProcessApplicationsStatusBar();

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByRole('dialog')).to.exist;
    });


    it('should close overlay on click', function() {

      // given
      createProcessApplicationsStatusBar();

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByRole('dialog')).to.exist;

      // when
      fireEvent.click(screen.queryAllByRole('button')[0]);

      // then
      expect(screen.queryByRole('dialog')).to.not.exist;
    });


    it('should open file on clicking file', function() {

      // given
      const onOpenSpy = sinon.spy();

      createProcessApplicationsStatusBar({
        onOpen: onOpenSpy
      });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('foo.bpmn'));

      // then
      expect(onOpenSpy).to.have.been.calledOnce;
    });

  });


  describe('no process application', function() {

    it('should render and indicate no process application', function() {

      // when
      createProcessApplicationsStatusBar({
        processApplication: null,
        processApplicationItems: []
      });

      // then
      const button = screen.getByRole('button');
      expect(button).to.exist;
      expect(button.classList.contains('has-process-application')).to.be.false;
    });


    it('should open overlay on click', function() {

      // given
      createProcessApplicationsStatusBar({
        processApplication: null,
        processApplicationItems: []
      });

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByText(/Create a new process application/i)).to.exist;
    });


    it('should close overlay on click', function() {

      // given
      createProcessApplicationsStatusBar({
        processApplication: null,
        processApplicationItems: []
      });

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByRole('dialog')).to.exist;

      // when
      fireEvent.click(screen.getAllByRole('button')[0]);

      // then
      expect(screen.queryByRole('dialog')).to.not.exist;
    });


    it('should trigger process application creation on click', function() {

      // given
      const onCreateProcessApplicationSpy = sinon.spy();

      createProcessApplicationsStatusBar({
        processApplication: null,
        processApplicationItems: [],
        onCreateProcessApplication: onCreateProcessApplicationSpy
      });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText(/Create a new process application/i));

      // then
      expect(onCreateProcessApplicationSpy).to.have.been.calledOnce;
    });

  });


  it('should not render for Camunda 7 files', function() {

    // when
    createProcessApplicationsStatusBar({
      processApplication: null,
      processApplicationItems: [],
      activeTab: {
        ...DEFAULT_OPEN_TAB,
        type: 'bpmn'
      }
    });

    // then
    expect(screen.queryByRole('button')).to.not.exist;
  });


  describe('<Overlay>', function() {

    it('should render name of process application file', function() {

      // when
      createProcessApplicationsStatusBar();

      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByText('.process-application')).to.exist;
    });


    it('should reveal process application file in file explorer on click', function() {

      // given
      const revealInFileExplorerSpy = sinon.spy();

      createProcessApplicationsStatusBar({
        onRevealInFileExplorer: revealInFileExplorerSpy
      });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('.process-application'));

      // then
      expect(revealInFileExplorerSpy).to.have.been.calledOnceWith('C://process-application/.process-application');
    });


    it('should render names process application files sorted', function() {

      // when
      createProcessApplicationsStatusBar();

      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByText('foo.bpmn')).to.exist;
      expect(screen.getByText('bar.dmn')).to.exist;
      expect(screen.getByText('baz.form')).to.exist;
    });


    it('should open process application file on click', function() {

      // given
      const onOpenSpy = sinon.spy();

      createProcessApplicationsStatusBar({
        onOpen: onOpenSpy
      });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('foo.bpmn'));

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
      createProcessApplicationsStatusBar({
        processApplicationItems
      });

      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByText('error.bpmn')).to.exist;
    });


    it('should not open process application file with error message on click', function() {

      // given
      const onOpenSpy = sinon.spy();

      const processApplicationItems = [
        ...DEFAULT_PROCESS_APPLICATION_ITEMS,
        PROCESS_APPLICATION_ITEM_ERROR
      ];

      createProcessApplicationsStatusBar({
        onOpen: onOpenSpy,
        processApplicationItems
      });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('error.bpmn'));

      // then
      expect(onOpenSpy).not.to.have.been.called;
    });

  });

});

const DEFAULT_OPEN_TAB = {
  file: {
    path: 'diagram_1.bpmn'
  },
  type: 'cloud-bpmn'
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

function createProcessApplicationsStatusBar(props = {}) {
  const {
    activeTab = DEFAULT_OPEN_TAB,
    onOpen = () => {},
    onCreateProcessApplication = () => {},
    onRevealInFileExplorer = () => {},
    processApplication = DEFAULT_PROCESS_APPLICATION,
    processApplicationItems = DEFAULT_PROCESS_APPLICATION_ITEMS,
    tabsProvider = new TabsProvider(activeTab)
  } = props;

  render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <ProcessApplicationsStatusBar
      activeTab={ activeTab }
      onOpen={ onOpen }
      onCreateProcessApplication={ onCreateProcessApplication }
      onRevealInFileExplorer={ onRevealInFileExplorer }
      processApplication={ processApplication }
      processApplicationItems={ processApplicationItems }
      tabsProvider={ tabsProvider }
      { ...props }
    />
  </SlotFillRoot>);
}
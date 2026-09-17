/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import React from 'react';

import { render, fireEvent, screen } from '@testing-library/react';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';

import { TabsProvider } from '../../../app/__tests__/mocks';

import CamundaProjectsStatusBar from '../CamundaProjectsStatusBar';

describe('<CamundaProjectsStatusBar>', function() {

  describe('Camunda project', function() {

    it('should render and indicate Camunda project', function() {

      // when
      createCamundaProjectsStatusBar();

      // then
      const button = screen.getByRole('button');
      expect(button).to.exist;
      expect(button.classList.contains('has-camunda-project')).to.be.true;
    });


    it('should open overlay on click', function() {

      // given
      createCamundaProjectsStatusBar();

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByRole('dialog')).to.exist;
    });


    it('should close overlay on click', function() {

      // given
      createCamundaProjectsStatusBar();

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

      createCamundaProjectsStatusBar({
        onOpen: onOpenSpy
      });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('foo.bpmn'));

      // then
      expect(onOpenSpy).to.have.been.calledOnce;
    });

  });


  describe('no Camunda project', function() {

    it('should render and indicate no Camunda project', function() {

      // when
      createCamundaProjectsStatusBar({
        camundaProject: null,
        camundaProjectItems: []
      });

      // then
      const button = screen.getByRole('button');
      expect(button).to.exist;
      expect(button.classList.contains('has-camunda-project')).to.be.false;
    });


    it('should open overlay on click', function() {

      // given
      createCamundaProjectsStatusBar({
        camundaProject: null,
        camundaProjectItems: []
      });

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByText(/Create a new Camunda project/i)).to.exist;
    });


    it('should close overlay on click', function() {

      // given
      createCamundaProjectsStatusBar({
        camundaProject: null,
        camundaProjectItems: []
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


    it('should trigger Camunda project creation on click', function() {

      // given
      const onCreateCamundaProjectSpy = sinon.spy();

      createCamundaProjectsStatusBar({
        camundaProject: null,
        camundaProjectItems: [],
        onCreateCamundaProject: onCreateCamundaProjectSpy
      });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText(/Create a new Camunda project/i));

      // then
      expect(onCreateCamundaProjectSpy).to.have.been.calledOnce;
    });

  });


  it('should not render for Camunda 7 files', function() {

    // when
    createCamundaProjectsStatusBar({
      camundaProject: null,
      camundaProjectItems: [],
      activeTab: {
        ...DEFAULT_OPEN_TAB,
        type: 'bpmn'
      }
    });

    // then
    expect(screen.queryByRole('button')).to.not.exist;
  });


  describe('<Overlay>', function() {

    it('should render name of Camunda project file', function() {

      // when
      createCamundaProjectsStatusBar();

      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByText('camunda-project.json')).to.exist;
    });


    it('should reveal Camunda project file in file explorer on click', function() {

      // given
      const revealInFileExplorerSpy = sinon.spy();

      createCamundaProjectsStatusBar({
        onRevealInFileExplorer: revealInFileExplorerSpy
      });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('camunda-project.json'));

      // then
      expect(revealInFileExplorerSpy).to.have.been.calledOnceWith('C://camunda-project/camunda-project.json');
    });


    it('should render names Camunda project files sorted', function() {

      // when
      createCamundaProjectsStatusBar();

      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByText('foo.bpmn')).to.exist;
      expect(screen.getByText('bar.dmn')).to.exist;
      expect(screen.getByText('baz.form')).to.exist;
    });


    it('should open Camunda project file on click', function() {

      // given
      const onOpenSpy = sinon.spy();

      createCamundaProjectsStatusBar({
        onOpen: onOpenSpy
      });

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('foo.bpmn'));

      // then
      expect(onOpenSpy).to.have.been.calledOnceWith('C://camunda-project/foo.bpmn');
    });


    it('should render names of files with error messages sorted', function() {

      // given
      const camundaProjectItems = [
        ...DEFAULT_CAMUNDA_PROJECT_ITEMS,
        CAMUNDA_PROJECT_ITEM_ERROR
      ];

      // when
      createCamundaProjectsStatusBar({
        camundaProjectItems
      });

      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByText('error.bpmn')).to.exist;
    });


    it('should not open Camunda project file with error message on click', function() {

      // given
      const onOpenSpy = sinon.spy();

      const camundaProjectItems = [
        ...DEFAULT_CAMUNDA_PROJECT_ITEMS,
        CAMUNDA_PROJECT_ITEM_ERROR
      ];

      createCamundaProjectsStatusBar({
        onOpen: onOpenSpy,
        camundaProjectItems
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

const DEFAULT_CAMUNDA_PROJECT = {
  file: {
    name: 'camunda-project.json',
    uri: 'file:///C:/camunda-project/camunda-project.json',
    path: 'C://camunda-project/camunda-project.json',
    dirname: 'C://camunda-project',
    contents: '{}'
  },
  metadata: {
    type: 'camundaProject'
  }
};

const DEFAULT_CAMUNDA_PROJECT_ITEMS = [
  {
    file: {
      name: 'foo.bpmn',
      uri: 'file:///C:/camunda-project/foo.bpmn',
      path: 'C://camunda-project/foo.bpmn',
      dirname: 'C://camunda-project',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      type: 'bpmn'
    }
  },
  {
    file: {
      name: 'bar.dmn',
      uri: 'file:///C:/camunda-project/bar.dmn',
      path: 'C://camunda-project/bar.dmn',
      dirname: 'C://camunda-project',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      type: 'dmn'
    }
  },
  {
    file: {
      name: 'baz.form',
      uri: 'file:///C:/camunda-project/baz.form',
      path: 'C://camunda-project/baz.form',
      dirname: 'C://camunda-project',
      contents: '{}'
    },
    metadata: {
      type: 'form'
    }
  },
  DEFAULT_CAMUNDA_PROJECT
];

const CAMUNDA_PROJECT_ITEM_ERROR = {
  file: {
    name: 'error.bpmn',
    uri: 'file:///C:/camunda-project/error.bpmn',
    path: 'C://camunda-project/error.bpmn',
    dirname: 'C://camunda-project',
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

function createCamundaProjectsStatusBar(props = {}) {
  const {
    activeTab = DEFAULT_OPEN_TAB,
    onOpen = () => {},
    onCreateCamundaProject = () => {},
    onRevealInFileExplorer = () => {},
    camundaProject = DEFAULT_CAMUNDA_PROJECT,
    camundaProjectItems = DEFAULT_CAMUNDA_PROJECT_ITEMS,
    tabsProvider = new TabsProvider(activeTab)
  } = props;

  render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <CamundaProjectsStatusBar
      activeTab={ activeTab }
      onOpen={ onOpen }
      onCreateCamundaProject={ onCreateCamundaProject }
      onRevealInFileExplorer={ onRevealInFileExplorer }
      camundaProject={ camundaProject }
      camundaProjectItems={ camundaProjectItems }
      tabsProvider={ tabsProvider }
      { ...props }
    />
  </SlotFillRoot>);
}
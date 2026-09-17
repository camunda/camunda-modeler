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

import CamundaProjects from '../CamundaProjects';

const { spy } = sinon;


describe('CamundaProjects', function() {

  let camundaProjects;

  beforeEach(function() {
    camundaProjects = new CamundaProjects();
  });


  describe('<items-changed>', function() {

    it('should open Camunda project on <items-changed>', function() {

      // given
      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      camundaProjects.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(camundaProjects.hasOpen()).to.be.false;

      // when
      camundaProjects.emit('items-changed', DEFAULT_ITEMS_CAMUNDA_PROJECT);

      // then
      expect(camundaProjects.hasOpen()).to.be.true;
      expect(camundaProjects.getItems()).to.have.length(2);

      expect(changedSpy).to.have.been.calledOnce;
    });


    it('should not open Camunda project on <items-changed> (no Camunda project)', function() {

      // given
      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      camundaProjects.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(camundaProjects.hasOpen()).to.be.false;

      // when
      camundaProjects.emit('items-changed', DEFAULT_ITEMS);

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.have.length(0);

      expect(changedSpy).to.not.have.been.called;
    });


    it('should not open Camunda project on <items-changed> (item not found)', function() {

      // given
      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      camundaProjects.emit('activeTab-changed', DEFAULT_ITEMS_CAMUNDA_PROJECT[2]);

      expect(camundaProjects.hasOpen()).to.be.false;

      // when
      camundaProjects.emit('items-changed', [
        DEFAULT_ITEMS_CAMUNDA_PROJECT[0],
        DEFAULT_ITEMS_CAMUNDA_PROJECT[1]
      ]);

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.have.length(0);

      expect(changedSpy).to.not.have.been.called;
    });


    it('should not open Camunda project on <items-changed> (empty tab)', function() {

      // given
      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      camundaProjects.emit('activeTab-changed', EMPTY_TAB);

      expect(camundaProjects.hasOpen()).to.be.false;

      // when
      camundaProjects.emit('items-changed', DEFAULT_ITEMS_CAMUNDA_PROJECT);

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.have.length(0);

      expect(changedSpy).to.not.have.been.called;
    });


    it('should not open Camunda project on <items-changed> (unsaved tab)', function() {

      // given
      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      camundaProjects.emit('activeTab-changed', UNSAVED_TAB);

      expect(camundaProjects.hasOpen()).to.be.false;

      // when
      camundaProjects.emit('items-changed', DEFAULT_ITEMS_CAMUNDA_PROJECT);

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.have.length(0);

      expect(changedSpy).to.not.have.been.called;
    });


    it('should close Camunda project on <items-changed>', function() {

      // given
      camundaProjects.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);
      camundaProjects.emit('items-changed', DEFAULT_ITEMS_CAMUNDA_PROJECT);

      expect(camundaProjects.hasOpen()).to.be.true;

      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      // when
      camundaProjects.emit('items-changed', DEFAULT_ITEMS);

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.have.length(0);

      expect(changedSpy).to.have.been.calledOnce;
    });

  });


  describe('<activeTab-changed>', function() {

    it('should open Camunda project on <activeTab-changed>', function() {

      // given
      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      camundaProjects.emit('items-changed', DEFAULT_ITEMS_CAMUNDA_PROJECT);

      expect(camundaProjects.hasOpen()).to.be.false;

      // when
      camundaProjects.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      // then
      expect(camundaProjects.hasOpen()).to.be.true;
      expect(camundaProjects.getItems()).to.have.length(2);

      expect(changedSpy).to.have.been.calledOnce;
    });


    it('should open nearest Camunda project on <activeTab-changed>', function() {

      // given
      const rootProject = DEFAULT_ITEMS_CAMUNDA_PROJECT[0];
      const nestedProject = {
        file: {
          name: '.process-application',
          uri: 'file:///C:/camunda-project/nested/.process-application',
          path: 'C://camunda-project/nested/.process-application',
          dirname: 'C://camunda-project/nested',
          contents: '{}'
        },
        metadata: {
          type: 'camundaProject'
        }
      };
      const nestedDiagram = {
        file: {
          name: 'nested.bpmn',
          uri: 'file:///C:/camunda-project/nested/nested.bpmn',
          path: 'C://camunda-project/nested/nested.bpmn',
          dirname: 'C://camunda-project/nested',
          contents: '<?xml version="1.0" encoding="UTF-8"?>'
        },
        metadata: {
          type: 'bpmn'
        }
      };

      camundaProjects.emit('items-changed', [ rootProject, nestedProject, nestedDiagram ]);

      // when
      camundaProjects.emit('activeTab-changed', { file: nestedDiagram.file });

      // then
      expect(camundaProjects.getOpen().file).to.equal(nestedProject.file);
      expect(camundaProjects.getItems()).to.eql([ nestedProject, nestedDiagram ]);
    });


    it('should close Camunda project on <activeTab-changed> (item not found)', function() {

      // given
      camundaProjects.emit('items-changed', [
        DEFAULT_ITEMS_CAMUNDA_PROJECT[0],
        DEFAULT_ITEMS_CAMUNDA_PROJECT[1]
      ]);
      camundaProjects.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(camundaProjects.hasOpen()).to.be.true;

      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      // when
      camundaProjects.emit('activeTab-changed', {
        file: DEFAULT_ITEMS_CAMUNDA_PROJECT[2].file
      });

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.have.length(0);

      expect(changedSpy).to.have.been.calledOnce;
    });


    it('should close Camunda project on <activeTab-changed> (unsaved tab)', function() {

      // given
      camundaProjects.emit('items-changed', DEFAULT_ITEMS_CAMUNDA_PROJECT);
      camundaProjects.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(camundaProjects.hasOpen()).to.be.true;

      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      // when
      camundaProjects.emit('activeTab-changed', UNSAVED_TAB);

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.have.length(0);

      expect(changedSpy).to.have.been.calledOnce;
    });


    it('should close Camunda project on <activeTab-changed> (empty tab)', function() {

      // given
      camundaProjects.emit('items-changed', DEFAULT_ITEMS_CAMUNDA_PROJECT);
      camundaProjects.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(camundaProjects.hasOpen()).to.be.true;

      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      // when
      camundaProjects.emit('activeTab-changed', EMPTY_TAB);

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.have.length(0);

      expect(changedSpy).to.have.been.calledOnce;
    });

  });


  describe('error handling', function() {

    it('should open Camunda project on <items-changed> (parse error)', function() {

      // given
      const changedSpy = spy();

      camundaProjects.on('changed', changedSpy);

      const errorSpy = spy();

      camundaProjects.on('error', errorSpy);

      camundaProjects.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(camundaProjects.hasOpen()).to.be.false;

      // when
      camundaProjects.emit('items-changed', DEFAULT_ITEMS_CAMUNDA_PROJECT_PARSE_ERROR);

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.have.length(0);

      expect(changedSpy).not.to.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
    });

  });


  describe('events', function() {

    it('should allow to subscribe and unsubscribe', function() {

      // given
      const callback = spy();

      // when
      camundaProjects.on('event', callback);
      camundaProjects.emit('event');

      // then
      expect(callback).to.have.been.calledOnce;

      // and when
      callback.resetHistory();
      camundaProjects.off('event', callback);
      camundaProjects.emit('event');

      // then
      expect(callback).not.to.have.been.called;
    });
  });

});

const DEFAULT_ITEMS = [
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
      name: 'bar.bpmn',
      uri: 'file:///C:/bar.bpmn',
      path: 'C://bar.bpmn',
      dirname: 'C://',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      type: 'bpmn'
    }
  }
];

const DEFAULT_ITEMS_CAMUNDA_PROJECT = [
  {
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
  },
  ...DEFAULT_ITEMS
];

const DEFAULT_ITEMS_CAMUNDA_PROJECT_PARSE_ERROR = [
  {
    file: {
      name: 'camunda-project.json',
      uri: 'file:///C:/camunda-project/camunda-project.json',
      path: 'C://camunda-project/camunda-project.json',
      dirname: 'C://camunda-project',
      contents: '{'
    },
    metadata: {
      type: 'camundaProject'
    }
  },
  ...DEFAULT_ITEMS
];

const DEFAULT_ACTIVE_TAB = {
  file: {
    ...DEFAULT_ITEMS[0].file
  }
};

const UNSAVED_TAB = {
  file: {
    path: null,
    contents: '<?xml version="1.0" encoding="UTF-8"?>'
  }
};

const EMPTY_TAB = {
  file: null
};

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

import ProcessApplications from '../ProcessApplications';

const { spy } = sinon;


describe('ProcessApplications', function() {

  let processApplications;

  beforeEach(function() {
    processApplications = new ProcessApplications();
  });


  describe('<items-changed>', function() {

    it('should open process application on <items-changed>', function() {

      // given
      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(processApplications.hasOpen()).to.be.false;

      // when
      processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION);

      // then
      expect(processApplications.hasOpen()).to.be.true;
      expect(processApplications.getItems()).to.have.length(2);

      expect(changedSpy).to.have.been.calledOnce;
    });


    it('should not open process application on <items-changed> (no process application)', function() {

      // given
      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(processApplications.hasOpen()).to.be.false;

      // when
      processApplications.emit('items-changed', DEFAULT_ITEMS);

      // then
      expect(processApplications.hasOpen()).to.be.false;
      expect(processApplications.getItems()).to.have.length(0);

      expect(changedSpy).to.not.have.been.called;
    });


    it('should not open process application on <items-changed> (item not found)', function() {

      // given
      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      processApplications.emit('activeTab-changed', DEFAULT_ITEMS_PROCESS_APPLICATION[2]);

      expect(processApplications.hasOpen()).to.be.false;

      // when
      processApplications.emit('items-changed', [
        DEFAULT_ITEMS_PROCESS_APPLICATION[0],
        DEFAULT_ITEMS_PROCESS_APPLICATION[1]
      ]);

      // then
      expect(processApplications.hasOpen()).to.be.false;
      expect(processApplications.getItems()).to.have.length(0);

      expect(changedSpy).to.not.have.been.called;
    });


    it('should not open process application on <items-changed> (empty tab)', function() {

      // given
      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      processApplications.emit('activeTab-changed', EMPTY_TAB);

      expect(processApplications.hasOpen()).to.be.false;

      // when
      processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION);

      // then
      expect(processApplications.hasOpen()).to.be.false;
      expect(processApplications.getItems()).to.have.length(0);

      expect(changedSpy).to.not.have.been.called;
    });


    it('should not open process application on <items-changed> (unsaved tab)', function() {

      // given
      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      processApplications.emit('activeTab-changed', UNSAVED_TAB);

      expect(processApplications.hasOpen()).to.be.false;

      // when
      processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION);

      // then
      expect(processApplications.hasOpen()).to.be.false;
      expect(processApplications.getItems()).to.have.length(0);

      expect(changedSpy).to.not.have.been.called;
    });


    it('should close process application on <items-changed>', function() {

      // given
      processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);
      processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION);

      expect(processApplications.hasOpen()).to.be.true;

      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      // when
      processApplications.emit('items-changed', DEFAULT_ITEMS);

      // then
      expect(processApplications.hasOpen()).to.be.false;
      expect(processApplications.getItems()).to.have.length(0);

      expect(changedSpy).to.have.been.calledOnce;
    });

  });


  describe('<activeTab-changed>', function() {

    it('should open process application on <activeTab-changed>', function() {

      // given
      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION);

      expect(processApplications.hasOpen()).to.be.false;

      // when
      processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      // then
      expect(processApplications.hasOpen()).to.be.true;
      expect(processApplications.getItems()).to.have.length(2);

      expect(changedSpy).to.have.been.calledOnce;
    });


    it('should close process application on <activeTab-changed> (item not found)', function() {

      // given
      processApplications.emit('items-changed', [
        DEFAULT_ITEMS_PROCESS_APPLICATION[0],
        DEFAULT_ITEMS_PROCESS_APPLICATION[1]
      ]);
      processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(processApplications.hasOpen()).to.be.true;

      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      // when
      processApplications.emit('activeTab-changed', {
        file: DEFAULT_ITEMS_PROCESS_APPLICATION[2].file
      });

      // then
      expect(processApplications.hasOpen()).to.be.false;
      expect(processApplications.getItems()).to.have.length(0);

      expect(changedSpy).to.have.been.calledOnce;
    });


    it('should close process application on <activeTab-changed> (unsaved tab)', function() {

      // given
      processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION);
      processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(processApplications.hasOpen()).to.be.true;

      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      // when
      processApplications.emit('activeTab-changed', UNSAVED_TAB);

      // then
      expect(processApplications.hasOpen()).to.be.false;
      expect(processApplications.getItems()).to.have.length(0);

      expect(changedSpy).to.have.been.calledOnce;
    });


    it('should close process application on <activeTab-changed> (empty tab)', function() {

      // given
      processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION);
      processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(processApplications.hasOpen()).to.be.true;

      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      // when
      processApplications.emit('activeTab-changed', EMPTY_TAB);

      // then
      expect(processApplications.hasOpen()).to.be.false;
      expect(processApplications.getItems()).to.have.length(0);

      expect(changedSpy).to.have.been.calledOnce;
    });

  });


  describe('error handling', function() {

    it('should open process application on <items-changed> (parse error)', function() {

      // given
      const changedSpy = spy();

      processApplications.on('changed', changedSpy);

      const errorSpy = spy();

      processApplications.on('error', errorSpy);

      processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

      expect(processApplications.hasOpen()).to.be.false;

      // when
      processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION_PARSE_ERROR);

      // then
      expect(processApplications.hasOpen()).to.be.false;
      expect(processApplications.getItems()).to.have.length(0);

      expect(changedSpy).not.to.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
    });

  });


  describe('events', function() {

    it('should allow to subscribe and unsubscribe', function() {

      // given
      const callback = spy();

      // when
      processApplications.on('event', callback);
      processApplications.emit('event');

      // then
      expect(callback).to.have.been.calledOnce;

      // and when
      callback.resetHistory();
      processApplications.off('event', callback);
      processApplications.emit('event');

      // then
      expect(callback).not.to.have.been.called;
    });
  });

});

const DEFAULT_ITEMS = [
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

const DEFAULT_ITEMS_PROCESS_APPLICATION = [
  {
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
  },
  ...DEFAULT_ITEMS
];

const DEFAULT_ITEMS_PROCESS_APPLICATION_PARSE_ERROR = [
  {
    file: {
      name: '.process-application',
      uri: 'file:///C:/process-application/.process-application',
      path: 'C://process-application/.process-application',
      dirname: 'C://process-application',
      contents: '{'
    },
    metadata: {
      type: 'processApplication'
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

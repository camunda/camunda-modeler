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

import TestContainer from 'mocha-test-container-support';

import DmnModeler from '../../../src/app/tabs/cloud-dmn/modeler/DmnModeler';
import DrdViewer from '../../../src/app/tabs/dmn/modeler/DrdViewer';

import diagramXML from './diagram.dmn';

const DEFAULT_OPTIONS = {
  exporter: {
    name: 'my-tool',
    version: '120-beta.100'
  }
};

const OVERVIEW_ZOOM_SCALE = 0.66;

const VERY_LOW_PRIORITY = 100;

inlineCSS(require('camunda-dmn-js/dist/assets/camunda-cloud-modeler.css'));

inlineCSS(`
  .test-content-container {
    display: flex;
    flex-direction: row;
  }

  .modeler-container,
  .overview-container {
    height: 100%;
  }

  .overview-container {
    width: 200px;
  }
`);


describe('DmnModeler', function() {

  this.timeout(10000);

  let modelerContainer,
      overviewContainer;

  beforeEach(function() {
    modelerContainer = document.createElement('div');
    modelerContainer.classList.add('modeler-container');

    overviewContainer = document.createElement('div');
    overviewContainer.classList.add('overview-container');

    const container = TestContainer.get(this);

    container.appendChild(overviewContainer);
    container.appendChild(modelerContainer);
  });


  it('should bootstrap', async function() {

    // when
    const modeler = await createModeler({
      container: modelerContainer
    });

    // then
    expect(modeler).to.exist;
  });


  describe('events', function() {

    let modeler;

    beforeEach(async function() {
      modeler = await createModeler({
        container: modelerContainer
      });
    });


    it('view.contentChanged', function() {

      // given
      const eventBus = modeler.getActiveViewer().get('eventBus');

      const spy = sinon.spy();

      modeler.on('view.contentChanged', spy);

      // when
      eventBus.fire('commandStack.changed');

      // then
      expect(spy).to.have.been.called;
    });


    it('view.selectionChanged', function() {

      // given
      const eventBus = modeler.getActiveViewer().get('eventBus');

      const spy = sinon.spy();

      modeler.on('view.selectionChanged', spy);

      // when
      eventBus.fire('selection.changed', { oldSelection: [], newSelection: [] });

      // then
      expect(spy).to.have.been.called;
    });


    it('view.directEditingChanged', function() {

      // given
      const eventBus = modeler.getActiveViewer().get('eventBus');

      const spy = sinon.spy();

      modeler.on('view.directEditingChanged', spy);

      // when
      eventBus.fire('directEditing.activate');

      // then
      expect(spy).to.have.been.called;
    });


    it('error', function() {

      // given
      const eventBus = modeler.getActiveViewer().get('eventBus');

      const spy = sinon.spy();

      modeler.on('error', spy);

      // when
      eventBus.fire('error');

      // then
      expect(spy).to.have.been.called;
    });


    it('propertiesPanel.focusin', function() {

      // given
      const eventBus = modeler.getActiveViewer().get('eventBus');

      const spy = sinon.spy();

      modeler.on('propertiesPanel.focusin', spy);

      // when
      eventBus.fire('propertiesPanel.focusin');

      // then
      expect(spy).to.have.been.called;
    });


    it('propertiesPanel.focusout', function() {

      // given
      const eventBus = modeler.getActiveViewer().get('eventBus');

      const spy = sinon.spy();

      modeler.on('propertiesPanel.focusout', spy);

      // when
      eventBus.fire('propertiesPanel.focusout');

      // then
      expect(spy).to.have.been.called;
    });

  });


  it('#getStackIdx', async function() {

    // when
    const modeler = await createModeler({
      container: modelerContainer
    });

    // then
    expect(modeler.getStackIdx()).to.equal(-1);
  });


  describe('overview', function() {

    let modeler;

    beforeEach(async function() {
      modeler = await createModeler({
        container: modelerContainer
      });

      modeler.attachOverviewTo(overviewContainer);
    });


    it('should have overview', function() {

      // then
      expect(modeler._overview).to.exist;
      expect(modeler._overview).to.be.instanceof(DrdViewer);
    });


    it('should import XML initially', function() {

      // then
      expect(modeler._overview.getDefinitions()).to.exist;
    });


    it('should set default zoom scale on import', function() {
      const overviewCanvas = modeler._overview.getActiveViewer().get('canvas');

      // then
      expect(overviewCanvas.zoom()).to.equal(OVERVIEW_ZOOM_SCALE);
    });


    it('should update overview on command stack changed', async function() {

      // given
      const spy = sinon.spy(modeler, '_updateOverview');

      // assume
      expect(modeler.getActiveView().type).to.equal('drd');

      // when
      modeler.getActiveViewer().get('eventBus').fire('commandStack.changed');

      // then
      expect(spy).to.have.been.called;
    });


    it('should listen to current command stack changed', async function() {

      // given
      await openDecisionTable(modeler);

      const spy = sinon.spy(modeler, '_updateOverview');

      // assume
      expect(modeler.getActiveView().type).to.equal('decisionTable');

      // when
      modeler.getActiveViewer().get('eventBus').fire('commandStack.changed');

      // then
      expect(spy).to.have.been.called;
    });


    it('should prevent others from hooking in when updating overview', async function() {

      // given
      const LOWER_PRIORITY = 1000,
            spy = sinon.spy();

      modeler.on('saveXML.start', LOWER_PRIORITY, spy);

      await openDecisionTable(modeler);

      // when
      modeler.getActiveViewer().get('eventBus').fire('commandStack.changed');

      // then
      expect(spy).not.to.have.been.called;
    });


    it('should highlight currently open DRG element', async function() {

      // when
      await openDecisionTable(modeler);

      // then
      expect(modeler.getActiveView().type).to.equal('decisionTable');

      expect(overviewContainer.querySelectorAll('.djs-element.open')).to.have.length(1);
    });


    it('should open DRG element on click', async function() {

      // given
      await openLiteralExpression(modeler);

      // assume
      expect(modeler.getActiveView().type).to.equal('literalExpression');

      // when
      modeler._overview.getActiveViewer().get('eventBus').fire('openDrgElement', {
        id: 'DecisionTable'
      });

      // then
      expect(modeler.getActiveView().element.id).to.equal('DecisionTable');
    });


    it('should center viewbox', async function() {

      // given
      await openDecisionTable(modeler);

      const openDrgElement = modeler._overview.getActiveViewer().get('openDrgElement');

      const spy = sinon.spy(openDrgElement, 'centerViewbox');

      // assume
      expect(modeler.getActiveView().type).to.equal('decisionTable');

      // when
      modeler._overview.getActiveViewer().get('eventBus').fire('overviewOpen');

      // then
      expect(spy).to.have.been.called;
    });


    describe('#canOpenDrgElement', function() {

      it('should return `true` for a BKM with literal expression', async function() {

        // given
        const openDrgElement = modeler._overview.getActiveViewer().get('openDrgElement');
        const bkm = modeler.getDefinitions().get('drgElement').find(element => element.id === 'GetTravelCost');

        // then
        expect(openDrgElement.canOpenDrgElement(bkm)).to.be.true;
      });


      it('should return `true` for a Decision with literal expression', async function() {

        // given
        const openDrgElement = modeler._overview.getActiveViewer().get('openDrgElement');
        const decision = modeler.getDefinitions().get('drgElement').find(element => element.id === 'LiteralExpression');

        // then
        expect(openDrgElement.canOpenDrgElement(decision)).to.be.true;
      });


      it('should return `true` for a Decision with decision table', async function() {

        // given
        const openDrgElement = modeler._overview.getActiveViewer().get('openDrgElement');
        const decision = modeler.getDefinitions().get('drgElement').find(element => element.id === 'DecisionTable');

        // then
        expect(openDrgElement.canOpenDrgElement(decision)).to.be.true;
      });


      it('should return `false` for a Decision without logic', async function() {

        // given
        const openDrgElement = modeler._overview.getActiveViewer().get('openDrgElement');
        const decision = modeler.getDefinitions().get('drgElement').find(element => element.id === 'NoLogic');

        // then
        expect(openDrgElement.canOpenDrgElement(decision)).to.be.false;
      });
    });
  });


  describe('execution platform', function() {

    it('should set execution platform when namespace is missing', async function() {

      // given
      const modeler = await createModeler({
        container: modelerContainer
      });

      // when
      const executionPlatformHelper = modeler.getActiveViewer().get('executionPlatform');
      executionPlatformHelper.setExecutionPlatform({
        name: 'Camunda Platform',
        version: '7.16.0'
      });

      // then
      const { xml } = await modeler.saveXML();

      expect(executionPlatformHelper.getExecutionPlatform()).to.eql({
        name: 'Camunda Platform',
        version: '7.16.0'
      });
      expect(xml).to.contain('xmlns:modeler="http://camunda.org/schema/modeler/1.0"');
    });
  });

});

// helpers //////////

/**
 * Create modeler and wait for modeler and overview import to finish before returning modeler.
 *
 * @param {Object} [options]
 *
 * @returns {Object}
 */
async function createModeler(options = {}) {
  const modeler = new DmnModeler({
    ...DEFAULT_OPTIONS,
    ...options
  });

  const overviewImport = new Promise(resolve => {
    modeler._overview.once('views.changed', VERY_LOW_PRIORITY, resolve);

    modeler._overview.on('import.done', ({ err, warnings }) => {

      // assume
      expect(err).not.to.exist;
      expect(warnings).to.be.empty;
    });
  });

  const modelerImport = new Promise(resolve => {
    modeler.once('views.changed', VERY_LOW_PRIORITY, resolve);

    modeler.importXML(diagramXML, (err, warnings) => {

      // assume
      expect(err).not.to.exist;
      expect(warnings).to.be.empty;
    });
  });

  return Promise.all([ overviewImport, modelerImport ]).then(() => modeler);
}

function inlineCSS(css) {
  var head = document.head || document.getElementsByTagName('head')[ 0 ],
      style = document.createElement('style');

  style.type = 'text/css';

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}

function openDecisionTable(modeler) {
  const views = modeler.getViews();

  const view = views.find(({ type }) => type === 'decisionTable');

  return new Promise(resolve => {
    modeler.once('views.changed', VERY_LOW_PRIORITY, ({ activeView }) => {

      // assume
      expect(activeView.type).to.equal('decisionTable');

      resolve(activeView);
    });

    modeler.open(view);
  });
}

function openLiteralExpression(modeler) {
  const views = modeler.getViews();

  const view = views.find(({ type }) => type === 'literalExpression');

  return new Promise(resolve => {
    modeler.once('views.changed', VERY_LOW_PRIORITY, ({ activeView }) => {

      // assume
      expect(activeView.type).to.equal('literalExpression');

      resolve(activeView);
    });

    modeler.open(view);
  });
}

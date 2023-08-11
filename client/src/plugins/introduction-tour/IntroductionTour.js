/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { PureComponent } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import * as selectors from './Selectors';
import { offset } from '@floating-ui/dom';
import { DEFAULT_WIDTH } from '../../app/resizable-container/PropertiesPanelContainer';
const CONFIG_KEY = 'editor.privacyPreferences';

let tour = null;

export default class IntroductionTour extends PureComponent {

  constructor(props) {
    super(props);

    this.props.subscribe('bpmn.modeler.created', async (event) => {
      this.modeler = event.modeler;
    });
  }

  async componentDidMount() {
    const {
      config
    } = this.props;

    let result = await config.get(CONFIG_KEY);

    if (!result) {
      this.createTour();
      this.createDiagramSteps();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyboardNavigation);
  }

  createTour = () => {
    const root = document.getElementById('root');
    const container = document.createElement('div');
    root.appendChild(container);

    tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shadow-md bg-purple-dark',
        scrollTo: true
      },
      modalContainer: container,
      exitOnEsc: true,
      keyboardNavigation: true,
      floatingUIOptions: {
        middleware: [ offset(50) ]
      }
    });
  };

  createDiagramSteps = () => {

    this.props.subscribe('diagram.created', async () => {

      // start
      tour.addStep({
        text: 'This is the bpmn editor. You can use it to model, deploy and start bpmn diagrams. </br></br> Click "Next" for a quick introduction.',
        attachTo: {
          element: '#root'
        },
        arrow: false,
        ...generateStepsOptions(tour, [ 'Next' ])
      });

      // palette
      tour.addStep({
        text: 'You can add new elements to the diagram by clicking or dragging them from the palette onto the diagram.',
        attachTo: {
          element: '.djs-palette',
          on: 'right'
        },
        ...generateStepsOptions(tour)
      });

      // context pad
      const startEventStep = tour.addStep({
        text: 'By selecting an element, the context pad will appear. It allows you to perform actions on the selected element.',
        attachTo: {
          element: '#overlay-div',
          on: 'bottom'
        },
        ...generateStepsOptions(tour)
      });


      startEventStep.on('before-show', () => {
        const element = this.modeler.get('elementRegistry').get('StartEvent_1');
        this.modeler.get('selection').select(element);

        wrapStartEventContextPad();
      });

      startEventStep.on('before-hide', () => {
        unwrapOverlayDiv();
        this.modeler.get('selection').select(null);
      });

      // properties panel
      const propertiesPanelStep = tour.addStep({
        text: 'Edit properties of the select element on the properties panel.',
        attachTo: {
          element: () => selectors.PROPERTIES_PANEL_CONTAINER,
          on: 'left'
        },
        ...generateStepsOptions(tour)
      });

      propertiesPanelStep.on('before-show', () => {
        const propertiesPanel = document.querySelector(selectors.PROPERTIES_PANEL_CONTAINER);
        const propertiesPanelOpen = !!propertiesPanel.getBoundingClientRect().width;
        if (!propertiesPanelOpen) {
          this.props.triggerAction('toggleProperties');
          propertiesPanel.style.width = DEFAULT_WIDTH;
        }
      });

      propertiesPanelStep.on('before-hide', () => {
        this.modeler.get('selection').select(null);
      });

      // problems view
      const problemsStep = tour.addStep({
        id: 'problemsPanelStep',
        text: 'You can view problem and warnings related to your diagram in the problems view.',
        attachTo: {
          element: () => {
            const panel = document.querySelector(selectors.PANEL_HEADER).parentElement;
            const panelOpen = !!panel.getBoundingClientRect().height;

            panelOpen && wrapProblemsPanel();

            return panelOpen ? '#overlay-div' : selectors.PROBLEMS_PANEL_BTN;
          },
          on: 'top'
        },
        ...generateStepsOptions(tour)
      });

      problemsStep.on('before-show', () => {
        document.querySelector(selectors.PROBLEMS_PANEL_BTN).addEventListener('click', showProblemPanelStep);
      });

      problemsStep.on('before-hide', () => {
        unwrapOverlayDiv();
        document.querySelector(selectors.PROBLEMS_PANEL_BTN).removeEventListener('click', showProblemPanelStep);
      });

      // deploy
      const deployStep = tour.addStep({
        id: 'deployStep',
        text: 'When you are done modeling, you can deploy the diagram to the Camunda Platform.',
        attachTo: {
          element: () => {
            const modal = document.querySelector(selectors.DEPLOY_START_MODAL);

            modal && wrapDeploy();

            return modal ? '#overlay-div' : selectors.DEPLOY_BTN;
          },
          on: 'top'
        },
        ...generateStepsOptions(tour)
      });

      deployStep.on('before-show', () => {
        document.querySelector(selectors.DEPLOY_BTN).addEventListener('click', showDeployStep);
      });

      deployStep.on('before-hide', () => {
        unwrapOverlayDiv();
        document.querySelector(selectors.DEPLOY_BTN).removeEventListener('click', showDeployStep);
      });

      // start instance
      const startInstanceStep = tour.addStep({
        id: 'startInstanceStep',
        text: 'After deploying, you can start a process instance.',
        attachTo: {
          element: () => {
            const modal = document.querySelector(selectors.DEPLOY_START_MODAL);

            modal && wrapStart();

            return modal ? '#overlay-div' : selectors.START_BTN;
          },
          on: 'top'
        },
        ...generateStepsOptions(tour)
      });

      startInstanceStep.on('before-show', () => {
        document.querySelector(selectors.START_BTN).addEventListener('click', showStartStep);
      });

      startInstanceStep.on('before-hide', () => {
        unwrapOverlayDiv();
        document.querySelector(selectors.START_BTN).removeEventListener('click', showStartStep);
      });

      // done
      tour.addStep({
        text: 'You are ready to start modeling!',
        attachTo: {
          element: '#root'
        },
        arrow: false,
        ...generateStepsOptions(tour, [ 'Back', 'Done' ])
      });

      tour.start();

    });
  };

  render() {
    return null;
  }
}


// helpers //////////////////////

function wrapStartEventContextPad() {
  const overlayDiv = document.createElement('div');
  overlayDiv.setAttribute('id', 'overlay-div');
  const startEvent = document.querySelector('.djs-element');
  const contextPad = document.querySelector('.djs-context-pad');

  const startEventRect = startEvent.getBoundingClientRect();
  const contextPadRect = contextPad.getBoundingClientRect();

  overlayDiv.style.position = 'absolute';
  overlayDiv.style.top = startEventRect.y - 8 + 'px';
  overlayDiv.style.left = startEventRect.x - 8 + 'px';
  overlayDiv.style.width = startEventRect.width + contextPadRect.width + 18 + 'px';
  overlayDiv.style.height = contextPadRect.height + 12 + 'px';

  document.querySelector('#root').appendChild(overlayDiv);
}

function unwrapOverlayDiv() {
  const overlayDiv = document.querySelector('#overlay-div');
  overlayDiv && overlayDiv.remove();
}

function wrapProblemsPanel() {
  const overlayDiv = document.createElement('div');
  overlayDiv.setAttribute('id', 'overlay-div');
  const panel = document.querySelector(selectors.PANEL_HEADER).parentElement;
  const button = document.querySelector(selectors.PROBLEMS_PANEL_BTN);

  const panelRect = panel.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  overlayDiv.style.position = 'absolute';
  overlayDiv.style.bottom = 0;
  overlayDiv.style.left = 0;
  overlayDiv.style.width = panelRect.width + 'px';
  overlayDiv.style.height = panelRect.height + buttonRect.height + 'px';

  document.querySelector('#root').appendChild(overlayDiv);
}

function wrapDeploy() {
  const overlayDiv = document.createElement('div');
  overlayDiv.setAttribute('id', 'overlay-div');
  const deploy = document.querySelector(selectors.DEPLOY_START_MODAL);
  const button = document.querySelector(selectors.DEPLOY_BTN);

  const deployRect = deploy.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  overlayDiv.style.position = 'absolute';
  overlayDiv.style.bottom = 0;
  overlayDiv.style.left = deployRect.x + 'px';
  overlayDiv.style.width = deployRect.width + 'px';
  overlayDiv.style.height = deployRect.height + buttonRect.height + 'px';

  document.querySelector('#root').appendChild(overlayDiv);
}

function wrapStart() {
  const overlayDiv = document.createElement('div');
  overlayDiv.setAttribute('id', 'overlay-div');
  const deploy = document.querySelector(selectors.DEPLOY_START_MODAL);
  const button = document.querySelector(selectors.START_BTN);

  const deployRect = deploy.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  overlayDiv.style.position = 'absolute';
  overlayDiv.style.bottom = 0;
  overlayDiv.style.left = deployRect.x + 'px';
  overlayDiv.style.width = deployRect.width + 'px';
  overlayDiv.style.height = deployRect.height + buttonRect.height + 'px';

  document.querySelector('#root').appendChild(overlayDiv);
}

function generateStepsOptions(tour, buttons = [ 'Back', 'Next' ]) {

  let buttonsOptions = [
    {
      text: 'Back',
      action: tour.back,
      classes: 'shepherd-button-secondary'
    },
    {
      text: 'Next',
      action: tour.next
    },
    {
      text: 'Done',
      action: tour.complete
    }
  ];

  buttons = buttonsOptions.filter((button) => {
    return buttons.includes(button.text);
  });

  return {
    cancelIcon: {
      enabled: true,
      label: 'Close'
    },
    buttons,
    floatingUIOptions: {
      middleware: [ offset(20) ]
    }
  };
}

async function showProblemPanelStep() {
  waitForElementToExist(selectors.PANEL_HEADER, () => {
    tour.getById('problemsPanelStep').show();
  });
}

async function showDeployStep() {

  if (document.querySelector(selectors.DEPLOY_BTN).classList.contains('btn--active')) {
    await new Promise((resolve) => { setTimeout(resolve, 10); });
    tour.getById('deployStep').show();
  }

  waitForElementToExist(selectors.DEPLOY_START_MODAL, () => {
    tour.getById('deployStep').show();
  });
}

async function showStartStep() {
  if (document.querySelector(selectors.START_BTN).classList.contains('btn--active')) {
    await new Promise((resolve) => { setTimeout(resolve, 10); });
    tour.getById('startInstanceStep').show();
  }

  waitForElementToExist(selectors.DEPLOY_START_MODAL, () => {
    tour.getById('startInstanceStep').show();
  });
}

function waitForElementToExist(selector, callback) {
  const intervalID = setInterval(() => {
    if (document.querySelector(selector)) {
      clearInterval(intervalID);
      callback();
    }
  }, 10);
}
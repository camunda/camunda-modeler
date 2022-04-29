/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import JSZip from 'jszip';
import $ from 'jquery';
import { saveAs } from 'file-saver';

import React, { Component } from 'react';

import { isFunction } from 'min-dash';

import { Fill } from '../../slot-fill';

import { Button, DropdownButton, Icon, Loader } from '../../primitives';

import { debounce } from '../../../util';

import { CachedComponent, WithCache, WithCachedState } from '../../cached';

import PropertiesContainer from '../PropertiesContainer';

import CamundaBpmnModeler from './modeler';

import { active as isInputActive } from '../../../util/dom/isInput';

import getBpmnContextMenu from './getBpmnContextMenu';

import { getBpmnEditMenu } from './getBpmnEditMenu';

import getBpmnWindowMenu from './getBpmnWindowMenu';

import css from './BpmnEditor.less';

import generateImage from '../../util/generateImage';

import applyDefaultTemplates from './modeler/features/apply-default-templates/applyDefaultTemplates';

import { findUsages as findNamespaceUsages, replaceUsages as replaceNamespaceUsages } from '../util/namespace';

import configureModeler from './util/configure';

import Metadata from '../../../util/Metadata';
import { getServiceTasksToDeploy } from '../../quantme/deployment/DeploymentUtils';
import { getRootProcess, createModeler } from '../../quantme/utilities/Utilities';
import { layout } from '../../quantme/layouter/Layouter';
import { createNewArtifactTemplate, createNewServiceTemplateVersion } from '../../quantme/deployment/OpenTOSCAUtils';

const NAMESPACE_URL_ACTIVITI = 'http://activiti.org/bpmn';

const NAMESPACE_CAMUNDA = {
  uri: 'http://camunda.org/schema/1.0/bpmn',
  prefix: 'camunda'
};

const EXPORT_AS = ['png', 'jpeg', 'svg', 'zip'];

const COLORS = [{
  title: 'White',
  fill: 'white',
  stroke: 'black'
}, {
  title: 'Blue',
  fill: 'rgb(187, 222, 251)',
  stroke: 'rgb(30, 136, 229)'
}, {
  title: 'Orange',
  fill: 'rgb(255, 224, 178)',
  stroke: 'rgb(251, 140, 0)'
}, {
  title: 'Green',
  fill: 'rgb(200, 230, 201)',
  stroke: 'rgb(67, 160, 71)'
}, {
  title: 'Red',
  fill: 'rgb(255, 205, 210)',
  stroke: 'rgb(229, 57, 53)'
}, {
  title: 'Purple',
  fill: 'rgb(225, 190, 231)',
  stroke: 'rgb(142, 36, 170)'
}];


export class BpmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();

    this.handleResize = debounce(this.handleResize);
  }

  async componentDidMount() {
    this._isMounted = true;

    const {
      layout
    } = this.props;

    const modeler = this.getModeler();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    const minimap = modeler.get('minimap');

    if (layout.minimap) {
      minimap.toggle(layout.minimap && !!layout.minimap.open);
    }

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.attachTo(this.propertiesPanelRef.current);


    try {
      await this.loadTemplates();
    } catch (error) {
      this.handleError({ error });
    }

    this.checkImport();
  }

  componentWillUnmount() {
    this._isMounted = false;

    const modeler = this.getModeler();

    this.listen('off');

    modeler.detach();

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.detach();
  }

  componentDidUpdate(prevProps) {
    this.checkImport(prevProps);

    if (isCacheStateChanged(prevProps, this.props)) {
      this.handleChanged();
    }
  }

  listen(fn) {
    const modeler = this.getModeler();

    [
      'import.done',
      'saveXML.done',
      'commandStack.changed',
      'selection.changed',
      'attach',
      'elements.copied',
      'propertiesPanel.focusin',
      'propertiesPanel.focusout',
      'directEditing.activate',
      'directEditing.deactivate',
      'searchPad.closed',
      'searchPad.opened'
    ].forEach((event) => {
      modeler[fn](event, this.handleChanged);
    });

    modeler[fn]('elementTemplates.errors', this.handleElementTemplateErrors);

    modeler[fn]('error', 1500, this.handleError);

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);
  }

  async loadTemplates() {
    const { getConfig } = this.props;

    const modeler = this.getModeler();

    const templatesLoader = modeler.get('elementTemplatesLoader');

    const templates = await getConfig('bpmn.elementTemplates');

    templatesLoader.setTemplates(templates);

    const propertiesPanel = modeler.get('propertiesPanel', false);

    if (propertiesPanel) {
      const currentElement = propertiesPanel._current && propertiesPanel._current.element;

      if (currentElement) {
        propertiesPanel.update(currentElement);
      }
    }
  }

  undo = () => {
    const modeler = this.getModeler();

    modeler.get('commandStack').undo();
  };

  redo = () => {
    const modeler = this.getModeler();

    modeler.get('commandStack').redo();
  };

  handleAlignElements = (type) => {
    this.triggerAction('alignElements', {
      type
    });
  };

  handleMinimapToggle = (event) => {
    this.handleLayoutChange({
      minimap: {
        open: event.open
      }
    });
  };

  handleElementTemplateErrors = (event) => {
    const {
      errors
    } = event;

    errors.forEach(error => {
      this.handleError({ error });
    });
  };

  handleError = (event) => {
    const {
      error
    } = event;

    const {
      onError
    } = this.props;

    onError(error);
  };

  handleNamespace = async (xml) => {
    const used = findNamespaceUsages(xml, NAMESPACE_URL_ACTIVITI);

    if (!used) {
      return xml;
    }

    const shouldConvert = await this.shouldConvert();

    if (!shouldConvert) {
      return xml;
    }

    const {
      onContentUpdated
    } = this.props;

    const convertedXML = await replaceNamespaceUsages(xml, used, NAMESPACE_CAMUNDA);

    onContentUpdated(convertedXML);

    return convertedXML;
  };

  async shouldConvert() {
    const { button } = await this.props.onAction('show-dialog', getNamespaceDialog());

    return button === 'yes';
  }

  handleImport = (error, warnings) => {
    const {
      isNew,
      onImport,
      xml
    } = this.props;

    let {
      defaultTemplatesApplied
    } = this.getCached();

    const modeler = this.getModeler();

    const commandStack = modeler.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    if (error) {
      this.setCached({
        defaultTemplatesApplied: false,
        lastXML: null
      });
    } else {

      if (isNew && !defaultTemplatesApplied) {
        modeler.invoke(applyDefaultTemplates);

        defaultTemplatesApplied = true;
      }

      this.setCached({
        defaultTemplatesApplied,
        lastXML: xml,
        stackIdx
      });

      this.setState({
        importing: false
      });
    }

    onImport(error, warnings);
  };

  handleChanged = () => {
    const modeler = this.getModeler();

    const {
      onChanged
    } = this.props;

    const dirty = this.isDirty();

    const commandStack = modeler.get('commandStack');
    const selection = modeler.get('selection');

    const selectionLength = selection.get().length;

    const inputActive = isInputActive();

    const newState = {
      align: selectionLength > 1,
      close: true,
      copy: !!selectionLength,
      cut: false,
      defaultCopyCutPaste: inputActive,
      defaultUndoRedo: inputActive,
      dirty,
      distribute: selectionLength > 2,
      editLabel: !inputActive && !!selectionLength,
      exportAs: EXPORT_AS,
      find: !inputActive,
      globalConnectTool: !inputActive,
      handTool: !inputActive,
      inputActive,
      lassoTool: !inputActive,
      moveCanvas: !inputActive,
      moveToOrigin: !inputActive,
      moveSelection: !inputActive && !!selectionLength,
      paste: !modeler.get('clipboard').isEmpty(),
      propertiesPanel: true,
      redo: commandStack.canRedo(),
      removeSelected: !!selectionLength || inputActive,
      save: true,
      selectAll: true,
      setColor: !!selectionLength,
      spaceTool: !inputActive,
      undo: commandStack.canUndo(),
      zoom: true
    };

    // ensure backwards compatibility
    // https://github.com/camunda/camunda-modeler/commit/78357e3ed9e6e0255ac8225fbdf451a90457e8bf#diff-bd5be70c4e5eadf1a316c16085a72f0fL17
    newState.bpmn = true;
    newState.editable = true;
    newState.elementsSelected = !!selectionLength;
    newState.inactiveInput = !inputActive;

    const contextMenu = getBpmnContextMenu(newState);

    const editMenu = getBpmnEditMenu(newState);

    const windowMenu = getBpmnWindowMenu(newState);

    if (isFunction(onChanged)) {
      onChanged({
        ...newState,
        contextMenu,
        editMenu,
        windowMenu
      });
    }

    this.setState(newState);
  };

  isDirty() {
    const {
      modeler,
      stackIdx
    } = this.getCached();

    const commandStack = modeler.get('commandStack');

    return commandStack._stackIdx !== stackIdx;
  }

  checkImport(prevProps) {

    if (!this.isImportNeeded(prevProps)) {
      return;
    }

    this.importXML();
  }

  isImportNeeded(prevProps) {
    const {
      importing
    } = this.state;

    if (importing) {
      return false;
    }

    const {
      xml
    } = this.props;

    if (prevProps && prevProps.xml === xml) {
      return false;
    }

    const {
      lastXML
    } = this.getCached();

    return xml !== lastXML;
  }

  async importXML() {
    const {
      xml
    } = this.props;

    this.setState({
      importing: true
    });

    const modeler = this.getModeler();

    const importedXML = await this.handleNamespace(xml);


    let error = null, warnings = null;
    try {

      const result = await modeler.importXML(importedXML);
      warnings = result.warnings;
    } catch (err) {

      error = err;
      warnings = err.warnings;
    }

    if (this._isMounted) {
      this.handleImport(error, warnings);
    }
  }

  /**
   * @returns {CamundaBpmnModeler}
   */
  getModeler() {
    const {
      modeler
    } = this.getCached();

    return modeler;
  }

  async getXML() {
    const {
      lastXML,
      modeler
    } = this.getCached();

    const commandStack = modeler.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    if (!this.isDirty()) {
      return lastXML || this.props.xml;
    }

    try {

      const { xml } = await modeler.saveXML({ format: true });

      this.setCached({ lastXML: xml, stackIdx });

      return xml;
    } catch (error) {

      this.handleError({ error });

      return Promise.reject(error);
    }
  }

  async exportAs(type, tab) {
    const svg = await this.exportSVG();

    if (type === 'svg') {
      return svg;
    }

    if (type === 'zip') {
      let contents = await this.exportQAA(tab);
      saveAs(contents, tab.name.split('.')[0] + '.zip');
      return;
    }

    return generateImage(type, svg);
  }

  async exportQAA(tab) {
    console.log('Starting QAA export!');

    // get modeler and JS zipper
    let jszip = new JSZip();
    const modeler = this.getModeler();

    // write the BPMN diagram to the zip
    const { xml } = await modeler.saveXML({ format: true });
    jszip.file(tab.name, xml);

    // get list of deployment models defined at service tasks
    let csarsToAdd = getServiceTasksToDeploy(getRootProcess(modeler.getDefinitions()));
    if (csarsToAdd && csarsToAdd.length > 0) {
      console.log('Adding %i CSARs to QAA!', csarsToAdd.length);

      // add folder for related deployment models to the QAA
      const deploymentModelFolder = jszip.folder('deployment-models');

      for (let id in csarsToAdd) {
        const csarToAdd = csarsToAdd[id];

        // create folder for the CSAR contents
        const csarFolder = deploymentModelFolder.folder(csarToAdd.csarName);

        // download CSAR from Winery
        const csarUrl = csarToAdd.url.replace('{{ wineryEndpoint }}', modeler.config.wineryEndpoint);
        const response = await fetch(csarUrl);
        const blob = await response.blob();

        // add content of the CSAR to the created folder
        await csarFolder.loadAsync(blob);
      }
    } else {
      console.log('No CSARs connected with service tasks!');
    }

    // export zip file
    return jszip.generateAsync({ type: 'blob' });
  }

  async importQAAs(qaaPaths) {
    console.log('Importing QAAs from paths: ', qaaPaths);

    let resultList = [];
    for (let id in qaaPaths) {
      resultList.push(await this.importQAA(qaaPaths[id]));
    }
    return resultList;
  }

  importQAA(qaaPath) {

    // retrieve Winery endpoint to upload CSARs to
    const wineryEndpoint = this.getModeler().config.wineryEndpoint;

    return new Promise(function(resolve, reject) {

      // request zip file representing QAA
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.responseType = 'blob';
      xmlhttp.onload = async function(callback) {
        if (xmlhttp.status === 200) {
          console.log('Request finished with status code 200 for QAA at path %s!', qaaPath);
          const blob = new Blob([xmlhttp.response], { type: 'application/zip' });

          // load zip file using JSZip
          let jszip = new JSZip();
          let zip = await jszip.loadAsync(blob);
          console.log('Successfully loaded zip!', zip);

          // find BPMN file in QAA
          let files = zip.filter(function(relativePath, file) {
            return !relativePath.startsWith('deployment-models') && relativePath.endsWith('.bpmn');
          });

          // check if exactly one workflow is contained in the QAA
          if (files.length !== 1) {
            console.error('QAA with path %s must contain exactly one BPMN file but contains %i!', qaaPath, files.length);
            reject('QAA with path %s must contain exactly one BPMN file but contains %i!', qaaPath, files.length);
          }

          // get folders representing CSARs
          let deploymentModels = zip.folder('deployment-models');
          deploymentModels.forEach(function(relativePath, file) {

            // CSARs must be direct subfolders
            if (file.dir && relativePath.split('/').length === 2) {
              let csar = zip.folder(file.name);
              csar.generateAsync({ type: 'blob' }).then(function(blob) {

                const fd = new FormData();
                fd.append('overwrite', 'false');
                fd.append('file', blob);
                $.ajax({
                  type: 'POST',
                  url: wineryEndpoint,
                  data: fd,
                  processData: false,
                  contentType: false,
                  success: function() {
                    console.log('Successfully uploaded CSAR: %s', file.name.split('/')[1]);
                  }
                });
              });
            }
          });

          // import BPMN file
          resolve({
            contents: await files[0].async('string'),
            name: files[0].name
          });
        }
      };
      xmlhttp.open('GET', 'file:///' + qaaPath, true);
      xmlhttp.send();
    });
  }

  async generateWorkflows(zipPaths) {
    console.log('Generating workflows from paths: ', zipPaths);

    let resultList = [];
    for (let id in zipPaths) {
      console.log('Generating workflow from path: ', zipPaths[id]);
      try {
        let workflow = await this.generateWorkflow(zipPaths[id]);
        if (workflow != null) {
          resultList.push(workflow);
        }
      } catch (error) {
        console.log('No workflow generation possible: ', error);
      }
    }
    console.log('Returning list of generated workflows: ', resultList);
    return resultList;
  }

  generateWorkflow(path) {

    // retrieve script splitter endpoint
    let scriptSplitterEndpoint = this.getModeler().config.scriptSplitterEndpoint;
    scriptSplitterEndpoint += scriptSplitterEndpoint.endsWith('/') ? '' : '/';
    console.log('Requesting script splitting at endpoint: ', scriptSplitterEndpoint);
    let self = this;

    return new Promise(function(resolve, reject) {

      // request zip file representing QAA
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.responseType = 'blob';
      xmlhttp.onload = async function(callback) {
        if (xmlhttp.status === 200) {
          console.log('Request finished with status code 200 for archive at path %s!', path);
          const blob = new Blob([xmlhttp.response], { type: 'application/zip' });

          // load zip file using JSZip
          let jszip = new JSZip();
          let zip = await jszip.loadAsync(blob);
          console.log('Successfully loaded zip!', zip);

          // get all Python files within the Zip archive
          let pythonFiles = zip.filter(function(relativePath, file) {
            return relativePath.endsWith('.py');
          });
          console.log('Found %d Python file(s) in the given archive!', pythonFiles.length);

          // check if exactly one Python file is contained in the archive
          if (pythonFiles.length !== 1) {
            console.error('Archive with path %s must contain exactly one Python file but contains %i!', path, pythonFiles.length);
            reject('Archive with path ' + path + ' must contain exactly one Python file but contains ' + pythonFiles.length);
            return;
          }

          // get all txt files within the Zip archive
          let requirementsFiles = zip.filter(function(relativePath, file) {
            return relativePath.endsWith('requirements.txt');
          });
          console.log('Found %d requirements.txt file(s) in the given archive!', requirementsFiles.length);

          // check if exactly one requirements.txt file is contained in the archive
          if (requirementsFiles.length !== 1) {
            console.error('Archive with path %s must contain exactly one requirements file but contains %i!', path, requirementsFiles.length);
            reject('Archive with path ' + path + ' must contain exactly one requirements file but contains ' + requirementsFiles.length);
            return;
          }

          console.log('Archive is valid, starting workflow generation!');
          let pythonFile = await pythonFiles[0].async('blob');
          let requirementsFile = await requirementsFiles[0].async('blob');

          // send request to script splitter
          const fd = new FormData();
          fd.append('script', pythonFile);
          fd.append('requirements', requirementsFile);
          fd.append('splitting_threshold', self.getModeler().config.scriptSplitterThreshold);
          $.ajax({
            type: 'POST',
            url: scriptSplitterEndpoint + 'qc-script-splitter/api/v1.0/split-qc-script',
            data: fd,
            processData: false,
            contentType: false,
            success: async function(result) {
              let pollingResult = await self.pollForResult(scriptSplitterEndpoint + result.Location.substring(1));
              let resultUrl = scriptSplitterEndpoint + pollingResult.resultUrl.substring(1);
              console.log('Retrieved URL to retrieve result zip file: ', resultUrl);

              // fetch result zip and get folder with script parts and meta-data
              let response = await fetch(resultUrl);
              const resultZipBlob = await response.blob();
              let resultZip = await new JSZip().loadAsync(resultZipBlob);

              // generate deployment models
              let deploymentModelUrls = await self.getDeploymentModelUrls(resultZip);
              console.log('Retrieved the following deployment model URLs: ', deploymentModelUrls);

              // get iterator scripts
              let contentFolder = resultZip.folder(pollingResult.jobId);
              let iteratorScripts = await self.getIteratorScripts(contentFolder);

              // extract workflow meta-data file and generate corresponding workflow model
              let workflowFile = contentFolder.file('workflow.json');
              let bpmnFile = await self.generateBpmnWorkflow(workflowFile, deploymentModelUrls, iteratorScripts);

              // import generated BPMN file
              resolve({
                contents: bpmnFile,
                name: pollingResult.jobId
              });
            }
          });
        }
      };

      // open file from given path using xmlhttp
      xmlhttp.open('GET', 'file:///' + path, true);
      xmlhttp.send();
    });
  }

  /**
   * Generate a workflow for the given meta-data file and associate the given deployment model URLs with the service tasks
   *
   * @param workflowFile
   * @param deploymentModelUrls
   * @param iteratorScripts
   */
  async generateBpmnWorkflow(workflowFile, deploymentModelUrls, iteratorScripts) {
    let workflowJson = JSON.parse(await workflowFile.async('string'));
    console.log('Generating workflow based on Json: ', workflowJson);

    // create modeler to host the generated workflow
    let modeler = createModeler();

    // initialize the modeler
    function initializeModeler() {
      return new Promise((resolve) => {
        modeler.createDiagram((err, successResponse) => {
          resolve(successResponse);
        });
      });
    }
    await initializeModeler();
    let modeling = modeler.get('modeling');
    let elementRegistry = modeler.get('elementRegistry');
    let bpmnFactory = modeler.get('bpmnFactory');

    // get root process of the modeler
    let rootElement = getRootProcess(modeler.getDefinitions());
    rootElement.isExecutable = true;

    // delete initial start event
    let startElement = elementRegistry.get(rootElement.flowElements[0].id);
    modeling.removeShape(startElement);

    // handle all elements of the workflow meta-data file
    let workflowElement = null;
    let lastIfs = [];
    let lastLoops = [];
    for (let i = 0; i < workflowJson.length; i++) {
      let metaElement = workflowJson[i];
      console.log('Handling element: ', metaElement);

      let dict = await this.createElementInWorkflow(modeling, elementRegistry, bpmnFactory, rootElement, workflowElement,
        metaElement, lastIfs, lastLoops, deploymentModelUrls, iteratorScripts);
      workflowElement = dict.newElement;
      lastIfs = dict.lastIfs;
      lastLoops = dict.lastLoops;
    }

    // layout the generated workflow model
    layout(modeling, elementRegistry, rootElement);

    // return the XML of the generated workflow
    function exportXmlWrapper() {
      return new Promise((resolve) => {
        modeler.saveXML((err, successResponse) => {
          resolve(successResponse);
        });
      });
    }
    return await exportXmlWrapper();
  }

  /**
   * Add a workflow element based on the entry of the given meta-data file
   *
   * @param modeling the modeling of the modeler to add the element to
   * @param elementRegistry the element registry to access the elements within the modeler
   * @param bpmnFactory the BPMN factory to create new element
   * @param parent the parent of the element to add
   * @param previousElement the previous element to connect the newly created element to
   * @param metaElement the entry of the meta-data file
   * @param lastIfs a list with the last if elements that were opened but not closed
   * @param lastLoops a list with the last loop elements that were opened but not closed
   * @param deploymentModelMap a map with URLs to deployment models to use for generated service tasks
   * @param iteratorScripts a map with scripts implementing iterators of for loops
   */
  async createElementInWorkflow(modeling, elementRegistry, bpmnFactory, parent, previousElement, metaElement,
      lastIfs, lastLoops, deploymentModelMap, iteratorScripts) {
    let rootElementBo = elementRegistry.get(parent.id);
    let newElement = null;
    let lastIfsElement = null;
    let lastLoopElement = null;
    let entryGateway = null;

    switch (metaElement.type) {
    case 'start':
      console.log('Generating StartEvent for element: ', metaElement);
      newElement = modeling.createShape({ type: 'bpmn:StartEvent' }, { x: 0, y: 0 }, rootElementBo, {});
      break;

    case 'task':
      console.log('Generating ServiceTask for element: ', metaElement);
      newElement = modeling.createShape({ type: 'bpmn:ServiceTask' }, { x: 0, y: 0 }, rootElementBo, {});
      newElement.businessObject.name = 'Execute part: ' + metaElement.file;

      if (deploymentModelMap[metaElement.file] !== null) {
        console.log('Adding deployment model URL: ', deploymentModelMap[metaElement.file]);
        newElement.businessObject.deploymentModelUrl = deploymentModelMap[metaElement.file];
      } else {
        console.error('Unable to find related deployment model URL!');
      }
      break;

    case 'end':
      console.log('Generating EndEvent for element: ', metaElement);
      newElement = modeling.createShape({ type: 'bpmn:EndEvent' }, { x: 0, y: 0 }, rootElementBo, {});
      break;

    case 'start_if':
      console.log('Generating XOR Gateway for element: ', metaElement);
      newElement = modeling.createShape({ type: 'bpmn:ExclusiveGateway' }, { x: 0, y: 0 }, rootElementBo, {});

      // store if for later connections of else statements
      lastIfs.push({ start_gateway: newElement, conditions: [metaElement.condition], branches: [] });
      break;

    case 'else_if':
      console.log('Changing branch for else_if element: ', metaElement);

      // update lasIfs to contain last element of the previous branch which has to be connected with the closing gateway for the if
      lastIfsElement = lastIfs.pop();
      lastIfsElement.branches.push(previousElement);

      // add condition
      lastIfsElement.conditions.push(metaElement.condition);
      lastIfs.push(lastIfsElement);

      // the next element in the meta-data file should be connected with the gateway representing the last if statement
      newElement = lastIfsElement.start_gateway;
      return { newElement: newElement, lastIfs: lastIfs, lastLoops: lastLoops };

    case 'else':
      console.log('No generation required for else element: ', metaElement);

      // update lasIfs to contain last element of the previous branch which has to be connected with the closing gateway for the if
      lastIfsElement = lastIfs.pop();
      lastIfsElement.branches.push(previousElement);

      // the condition of the else branch is concatenated from the conditions of the other branches
      // eslint-disable-next-line no-case-declarations
      let condition = '!(' + lastIfsElement.conditions.join(' || ') + ')';
      console.log('Condition of else branch: ', condition);
      lastIfsElement.conditions.push(condition);
      lastIfs.push(lastIfsElement);

      // the next element in the meta-data file should be connected with the gateway representing the last if statement
      newElement = lastIfsElement.start_gateway;
      return { newElement: newElement, lastIfs: lastIfs, lastLoops: lastLoops };

    case 'end_if':
      console.log('Adding closing XOR Gateway for end_if element: ', metaElement);
      newElement = modeling.createShape({ type: 'bpmn:ExclusiveGateway' }, { x: 0, y: 0 }, rootElementBo, {});

      // connect branches to new gateway
      lastIfsElement = lastIfs.pop();
      lastIfsElement.branches.push(previousElement);
      console.log('Closing if based on the following information: ', lastIfsElement);
      for (let elementToConnect of lastIfsElement.branches) {
        console.log('Connecting element: ', elementToConnect);
        modeling.connect(elementToConnect, newElement, { type: 'bpmn:SequenceFlow' });
      }

      return { newElement: newElement, lastIfs: lastIfs, lastLoops: lastLoops };

    case 'start_for':
      console.log('Adding Script Task and XOR Gateways representing for loop: ', metaElement);

      // add XOR Gateways and Script Task with iterator representing body of the for loop
      entryGateway = modeling.createShape({ type: 'bpmn:ExclusiveGateway' }, { x: 0, y: 0 }, rootElementBo, {});
      lastLoops = this.connectPreviousAndNewElement(bpmnFactory, modeling, elementRegistry, previousElement, entryGateway, lastIfs, lastLoops);

      // create ScriptTask and add retrieved iterator script
      // eslint-disable-next-line no-case-declarations
      let script = modeling.createShape({ type: 'bpmn:ScriptTask' }, { x: 0, y: 0 }, rootElementBo, {});
      script.businessObject.name = 'Iterator: ' + metaElement.iterator;
      script.businessObject.scriptFormat = 'javascript';
      script.businessObject.script = await iteratorScripts[metaElement.iterator].async('text');
      script.businessObject.asyncBefore = true;

      // connect XOR ans Script
      lastLoops = this.connectPreviousAndNewElement(bpmnFactory, modeling, elementRegistry, entryGateway, script, lastIfs, lastLoops);

      // create final XOR and connect with Script
      newElement = modeling.createShape({ type: 'bpmn:ExclusiveGateway' }, { x: 0, y: 0 }, rootElementBo, {});
      lastLoops = this.connectPreviousAndNewElement(bpmnFactory, modeling, elementRegistry, script, newElement, lastIfs, lastLoops);
      newElement.businessObject.name = metaElement.iterator + ' == null?';

      // add loop meta data
      lastLoops.push({ entryGateway: entryGateway, exitGateway: newElement, exitCondition: metaElement.iterator + ' == null' });
      return { newElement: newElement, lastIfs: lastIfs, lastLoops: lastLoops };

    case 'end_while':
    case 'end_for':
      console.log('Terminating loop by resetting last element to connect next element to: ', metaElement);

      // connect last part of the loop with the entry gateway and reset to continue sequence flow at exit gateway
      console.log('Currently %d open loops available!', lastLoops.length);
      lastLoopElement = lastLoops[lastLoops.length - 1];
      if (lastLoopElement.entryGateway.incoming.length === 2 && lastLoops.length >= 2) {

        // if there are two sequential end_for statements, the exit gateway of the inner one must be connected with the entry gateway of the outer
        console.log('Found two sequential end_for or end_while statements!');
        let previous = lastLoops[lastLoops.length - 2];
        lastLoops = this.connectPreviousAndNewElement(bpmnFactory, modeling, elementRegistry, lastLoopElement.exitGateway, previous.entryGateway, lastIfs, lastLoops);
        lastLoopElement = previous;
        console.log('Remaining open loops: ', lastLoops.length);
      } else {
        lastLoops = this.connectPreviousAndNewElement(bpmnFactory, modeling, elementRegistry, previousElement, lastLoopElement.entryGateway, lastIfs, lastLoops);
      }

      return { newElement: lastLoopElement.exitGateway, lastIfs: lastIfs, lastLoops: lastLoops };

    case 'start_while':
      console.log('Adding XOR Gateways representing while loop: ', metaElement);

      // add entry gateway
      entryGateway = modeling.createShape({ type: 'bpmn:ExclusiveGateway' }, { x: 0, y: 0 }, rootElementBo, {});
      lastLoops = this.connectPreviousAndNewElement(bpmnFactory, modeling, elementRegistry, previousElement, entryGateway, lastIfs, lastLoops);

      // add exit gateway
      newElement = modeling.createShape({ type: 'bpmn:ExclusiveGateway' }, { x: 0, y: 0 }, rootElementBo, {});
      lastLoops = this.connectPreviousAndNewElement(bpmnFactory, modeling, elementRegistry, entryGateway, newElement, lastIfs, lastLoops);
      newElement.businessObject.name = metaElement.condition + '?';

      // store while loop for connection of exit path
      lastLoops.push({ entryGateway: entryGateway, exitGateway: newElement, exitCondition: metaElement.condition });
      return { newElement: newElement, lastIfs: lastIfs, lastLoops: lastLoops };

    default:
      console.log('Unable to handle element of type: ', metaElement.type);
    }

    // connect the newly added element with the previous one
    lastLoops = this.connectPreviousAndNewElement(bpmnFactory, modeling, elementRegistry, previousElement, newElement, lastIfs, lastLoops);
    return { newElement: newElement, lastIfs: lastIfs, lastLoops: lastLoops };
  }

  /**
   * Connect the previous and the new element within the generated workflow and add a corresponding condition if it is
   * part of a loop or an if statement
   *
   * @param bpmnFactory
   * @param modeling
   * @param elementRegistry
   * @param previousElement
   * @param newElement
   * @param lastIfs
   * @param lastLoops
   */
  connectPreviousAndNewElement(bpmnFactory, modeling, elementRegistry, previousElement, newElement, lastIfs, lastLoops) {
    if (newElement !== null && previousElement !== null) {
      let sequenceFlow = modeling.connect(previousElement, newElement, { type: 'bpmn:SequenceFlow' });
      let sequenceFlowBo = elementRegistry.get(sequenceFlow.id).businessObject;

      // if previous element was a gateway, check if we have to add a corresponding condition
      if (previousElement.type === 'bpmn:ExclusiveGateway' && (lastIfs.length > 0 || lastLoops.length > 0)) {
        console.log('Previous element was ExclusiveGateway, checking if a condition has to be added: ', previousElement);

        // handle ifs
        if (lastIfs.length > 0 && lastIfs[lastIfs.length - 1].start_gateway === previousElement) {
          let metaDataIf = lastIfs[lastIfs.length - 1];
          let condition = metaDataIf.conditions[metaDataIf.conditions.length - 1];
          console.log('Previous element is ExclusiveGateway starting an if statement, adding condition: ', condition);

          // add condition
          sequenceFlowBo.name = condition;
          let formalExpression = bpmnFactory.create('bpmn:FormalExpression');
          formalExpression.body = '${' + condition + '}';
          sequenceFlowBo.conditionExpression = formalExpression;
        }

        // handle loops
        if (lastLoops.length > 0 && lastLoops[lastLoops.length - 1].exitGateway === previousElement) {
          let metaDataLoop = lastLoops[lastLoops.length - 1];
          let condition;
          console.log('Previous element is ExclusiveGateway terminating a loop: ', metaDataLoop);

          // add inverted exit condition for sequence flow within the loop
          console.log('Gateway: ', metaDataLoop.exitGateway);
          if (metaDataLoop.exitGateway.outgoing.length < 2) {
            condition = '${' + metaDataLoop.exitCondition + '}';
            sequenceFlowBo.name = 'true';
          } else {
            condition = '${!(' + metaDataLoop.exitCondition + ')}';
            sequenceFlowBo.name = 'false';

            lastLoops.pop();
          }
          let formalExpression = bpmnFactory.create('bpmn:FormalExpression');
          formalExpression.body = condition;
          sequenceFlowBo.conditionExpression = formalExpression;
        }
      }
    }
    return lastLoops;
  }

  /**
   * Get a map with all iterator scripts for the given zip file
   *
   * @param zip
   * @return {Promise<{}>}
   */
  async getIteratorScripts(zip) {
    let iteratorScripts = {};
    zip.folder('iterators').forEach(function(relativePath, file) {
      let iteratorName = relativePath.split('.')[0];
      iteratorScripts[iteratorName] = file;
    });

    console.log('Retrieved iterator scripts: ', iteratorScripts);
    return iteratorScripts;
  }

  /**
   * Get a dict with URLs to deployment models for the script parts contained in the given zip
   *
   * @param zip
   * @return {Promise<{}>}
   */
  async getDeploymentModelUrls(zip) {

    // iterate through the files and generate a deployment model for the script part
    let deploymentModelUrls = {};
    for (let fileName in zip.files) {
      let dockerFile = zip.file(fileName);

      // we need a Dockerfile file to build the container for the script part
      if (!dockerFile.name.endsWith('Dockerfile')) {
        continue;
      }
      console.log('Found Dockerfile for script part with path "%s". Searching for related service.zip...', fileName);

      // search service.zip
      let zipFile = zip.file(dockerFile.name.replace('Dockerfile', 'service.zip'));
      if (zipFile == null) {
        console.log('Unable to find service.zip file!');
        continue;
      }

      // get name of the script part
      let scriptPartName = dockerFile.name.split('/');
      if (scriptPartName.length !== 3) {
        continue;
      }
      scriptPartName = scriptPartName[1];
      console.log('Name of found script part: ', scriptPartName);

      // generate deployment model and retrieve URL
      deploymentModelUrls[scriptPartName] = await this.generateDeploymentModel(scriptPartName, dockerFile, zipFile,
        this.getModeler().config.wineryEndpoint);
    }

    return deploymentModelUrls;
  }

  /**
   * Generate a deployment model for the script part defined by the given Python and requirements file
   *
   * @param scriptPartName
   * @param dockerFile
   * @param zipFile
   * @param wineryEndpoint
   * @return {Promise<string>}
   */
  async generateDeploymentModel(scriptPartName, dockerFile, zipFile, wineryEndpoint) {
    console.log('Generating new ArtifactTemplate for Dockerfile: ', scriptPartName);

    // create blob for the DeploymentArtifact containing the Dockerfile and the Zip
    let daZip = new JSZip();
    await daZip.file('Dockerfile', await dockerFile.async('blob'));
    await daZip.file('service.zip', await zipFile.async('blob'));
    let daBlob = await daZip.generateAsync({ type: 'blob' });

    // create a new ArtifactTemplate and upload the script part, requirements, polling agent, and dockerfile
    let artifactName = await createNewArtifactTemplate(wineryEndpoint, 'script-part-' + scriptPartName,
      'http://quantil.org/quantme/pull/artifacttemplates',
      '{http://opentosca.org/artifacttypes}DockerContainerArtifact', daBlob,
      'script-part.zip');
    console.log('Created ArtifactTemplate with name: ', artifactName);

    // create new ServiceTemplate for the script by adding a new version of the predefined template
    let serviceTemplateURL = await createNewServiceTemplateVersion(wineryEndpoint, 'ScriptPartService', 'http://quantil.org/quantme/pull');
    if (serviceTemplateURL.error !== undefined) {
      console.error('ServiceTemplate creation resulted in error: ', serviceTemplateURL.error);
      return serviceTemplateURL.error;
    }

    // update DA reference within the created ServiceTemplate version
    let getTemplateXmlResult = await fetch(serviceTemplateURL + 'xml');
    let getTemplateXmlResultJson = await getTemplateXmlResult.text();
    getTemplateXmlResultJson = getTemplateXmlResultJson.replace(':ScriptPartContainer_DA"', ':' + artifactName + '"');
    await fetch(serviceTemplateURL, {
      method: 'PUT',
      body: getTemplateXmlResultJson,
      headers: { 'Content-Type': 'application/xml' }
    });

    // replace concrete Winery endpoint with abstract placeholder to enable QAA transfer into another environment
    let deploymentModelUrl = serviceTemplateURL.replace(wineryEndpoint, '{{ wineryEndpoint }}');
    deploymentModelUrl += '?csar';
    return deploymentModelUrl;
  }

  async pollForResult(url) {
    console.log('Polling for task resource at: ', url);

    let complete = false;
    let resultUrl = '';
    let jobId = '';
    while (complete === false) {

      // wait 5 seconds for next poll
      await new Promise(r => setTimeout(r, 5000));

      // poll for current state
      let pollingResponse = await fetch(url);
      let pollingResponseJson = await pollingResponse.json();
      console.log('Polling response: ', pollingResponseJson);

      complete = pollingResponseJson.complete;
      resultUrl = pollingResponseJson.script_parts_url;
      jobId = pollingResponseJson.id;
    }

    return { jobId: jobId, resultUrl: resultUrl };
  }

  async exportSVG() {
    const modeler = this.getModeler();

    try {

      const { svg } = await modeler.saveSVG();

      return svg;
    } catch (err) {

      return Promise.reject(err);
    }
  }

  triggerAction = (action, context) => {
    const { propertiesPanel: propertiesPanelLayout } = this.props.layout;
    const modeler = this.getModeler();

    if (action === 'resize') {
      return this.handleResize();
    }

    if (action === 'toggleProperties') {
      const newLayout = {
        propertiesPanel: {
          ...propertiesPanelLayout,
          open: !propertiesPanelLayout.open
        }
      };

      return this.handleLayoutChange(newLayout);
    }

    if (action === 'resetProperties') {
      const newLayout = {
        propertiesPanel: {
          width: 250,
          open: true
        }
      };

      return this.handleLayoutChange(newLayout);
    }

    if (action === 'zoomIn') {
      action = 'stepZoom';

      context = {
        value: 1
      };
    }

    if (action === 'zoomOut') {
      action = 'stepZoom';

      context = {
        value: -1
      };
    }

    if (action === 'resetZoom') {
      action = 'zoom';

      context = {
        value: 1
      };
    }

    if (action === 'zoomFit') {
      action = 'zoom';

      context = {
        value: 'fit-viewport'
      };
    }

    if (action === 'elementTemplates.reload') {
      return this.loadTemplates();
    }

    // TODO(nikku): handle all editor actions
    return modeler.get('editorActions').trigger(action, context);
  };

  handleSetColor = (fill, stroke) => {
    this.triggerAction('setColor', {
      fill,
      stroke
    });
  };

  handleDistributeElements = (type) => {
    this.triggerAction('distributeElements', {
      type
    });
  };

  handleContextMenu = (event) => {

    const {
      onContextMenu
    } = this.props;

    if (isFunction(onContextMenu)) {
      onContextMenu(event);
    }
  };

  handleLayoutChange(newLayout) {
    const {
      onLayoutChanged
    } = this.props;

    if (isFunction(onLayoutChanged)) {
      onLayoutChanged(newLayout);
    }
  }

  handleResize = () => {
    const modeler = this.getModeler();

    const canvas = modeler.get('canvas');
    const eventBus = modeler.get('eventBus');

    canvas.resized();
    eventBus.fire('propertiesPanel.resized');
  };

  render() {

    const {
      layout,
      onLayoutChanged
    } = this.props;

    const imported = this.getModeler().getDefinitions();

    const {
      importing
    } = this.state;

    return (
      <div className={ css.BpmnEditor }>

        <Loader hidden={ imported && !importing } />

        <Fill slot="toolbar" group="5_color">
          <DropdownButton
            title="Set element color"
            disabled={ !this.state.setColor }
            items={
              () => COLORS.map((color, index) => {
                const { fill, stroke, title } = color;

                return (
                  <Color
                    fill={ fill }
                    key={ index }
                    stroke={ stroke }
                    title={ title }
                    onClick={ () => this.handleSetColor(fill, stroke) } />
                );
              })
            }
          >
            <Icon name="set-color-tool" />
          </DropdownButton>
        </Fill>

        <Fill slot="toolbar" group="6_align">
          <Button
            title="Align elements left"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('left') }
          >
            <Icon name="align-left-tool" />
          </Button>
          <Button
            title="Align elements center"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('center') }
          >
            <Icon name="align-center-tool" />
          </Button>
          <Button
            title="Align elements right"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('right') }
          >
            <Icon name="align-right-tool" />
          </Button>
          <Button
            title="Align elements top"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('top') }>
            <Icon name="align-top-tool" />
          </Button>
          <Button
            title="Align elements middle"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('middle') }
          >
            <Icon name="align-middle-tool" />
          </Button>
          <Button
            title="Align elements bottom"
            disabled={ !this.state.align }
            onClick={ () => this.handleAlignElements('bottom') }
          >
            <Icon name="align-bottom-tool" />
          </Button>
        </Fill>

        <Fill slot="toolbar" group="7_distribute">
          <Button
            title="Distribute elements horizontally"
            disabled={ !this.state.distribute }
            onClick={ () => this.handleDistributeElements('horizontal') }
          >
            <Icon name="distribute-horizontal-tool" />
          </Button>
          <Button
            title="Distribute elements vertically"
            disabled={ !this.state.distribute }
            onClick={ () => this.handleDistributeElements('vertical') }
          >
            <Icon name="distribute-vertical-tool" />
          </Button>
        </Fill>

        <div
          className="diagram"
          ref={ this.ref }
          onFocus={ this.handleChanged }
          onContextMenu={ this.handleContextMenu }
        ></div>

        <PropertiesContainer
          className="properties"
          layout={ layout }
          ref={ this.propertiesPanelRef }
          onLayoutChanged={ onLayoutChanged } />
      </div>
    );
  }

  static createCachedState(props) {

    const {
      name,
      version
    } = Metadata;

    const {
      getPlugins,
      onAction,
      onError
    } = props;

    // notify interested parties that modeler will be configured
    const handleMiddlewareExtensions = (middlewares) => {
      onAction('emit-event', {
        type: 'bpmn.modeler.configure',
        payload: {
          middlewares
        }
      });
    };

    const {
      options,
      warnings
    } = configureModeler(getPlugins, {
      exporter: {
        name,
        version
      },
    }, handleMiddlewareExtensions);

    if (warnings.length && isFunction(onError)) {
      onError(
        'Problem(s) configuring BPMN editor: \n\t' +
        warnings.map(error => error.message).join('\n\t') +
        '\n'
      );
    }

    const modeler = new CamundaBpmnModeler({
      ...options,
      position: 'absolute'
    });

    const commandStack = modeler.get('commandStack');

    const stackIdx = commandStack._stackIdx;

    // notify interested parties that modeler was created
    onAction('emit-event', {
      type: 'bpmn.modeler.created',
      payload: {
        modeler
      }
    });

    return {
      __destroy: () => {
        modeler.destroy();
      },
      lastXML: null,
      modeler,
      namespaceDialogShown: false,
      stackIdx,
      templatesLoaded: false
    };
  }

}


export default WithCache(WithCachedState(BpmnEditor));

class Color extends Component {
  render() {
    const {
      fill,
      onClick,
      stroke,
      title,
      ...rest
    } = this.props;

    return (
      <div
        className={ css.Color }
        onClick={ onClick }
        style={ {
          backgroundColor: fill,
          borderColor: stroke
        } }
        title={ title }
        { ...rest }></div>
    );
  }
}

// helpers //////////

function getNamespaceDialog() {
  return {
    type: 'warning',
    title: 'Deprecated <activiti> namespace detected',
    buttons: [
      { id: 'cancel', label: 'Cancel' },
      { id: 'yes', label: 'Yes' }
    ],
    message: 'Would you like to convert your diagram to the <camunda> namespace?',
    detail: [
      'This will allow you to maintain execution related properties.',
      '',
      '<camunda> namespace support works from Camunda BPM versions 7.4.0, 7.3.3, 7.2.6 onwards.'
    ].join('\n')
  };
}

function isCacheStateChanged(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}

/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';

import { isFunction } from 'min-dash';

import {
  Loader
} from '../../primitives';

import {
  debounce
} from '../../../util';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import PropertiesContainer from '../PropertiesContainer';

import BpmnModeler from './modeler';

import { active as isInputActive } from '../../../util/dom/isInput';

import getBpmnContextMenu from '../bpmn/getBpmnContextMenu';

import { getBpmnEditMenu } from '../bpmn/getBpmnEditMenu';

import getBpmnWindowMenu from '../bpmn/getBpmnWindowMenu';

import css from './BpmnEditor.less';

import generateImage from '../../util/generateImage';

import applyDefaultTemplates from '../bpmn-shared/modeler/features/apply-default-templates/applyDefaultTemplates';

import configureModeler from '../bpmn-shared/util/configure';

import Metadata from '../../../util/Metadata';

import { DEFAULT_LAYOUT as propertiesPanelDefaultLayout } from '../PropertiesContainer';

import {
  EngineProfile,
  getEngineProfileFromBpmn
} from '../EngineProfile';

import EngineProfileHelper from '../EngineProfileHelper';

import { Linting } from '../Linting';

import Panel from '../panel/Panel';

import LintingTab from '../panel/tabs/LintingTab';

import {
  ENGINES
} from '../../../util/Engines';

import { getCloudTemplates } from '../../../util/elementTemplates';

import BotIcon from '../../../../resources/icons/Bot.svg';
import UserIcon from '../../../../resources/icons/User.svg';

import chat from '../../question.json';

const EXPORT_AS = [ 'png', 'jpeg', 'svg' ];

export const DEFAULT_ENGINE_PROFILE = {
  executionPlatform: ENGINES.CLOUD
};

const LOW_PRIORITY = 500;


export class BpmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();

    this.engineProfile = new EngineProfileHelper({
      get: () => {
        const modeler = this.getModeler();

        const definitions = modeler.getDefinitions();

        return getEngineProfileFromBpmn(definitions, DEFAULT_ENGINE_PROFILE);
      },
      set: (engineProfile) => {
        const modeler = this.getModeler();

        const canvas = modeler.get('canvas'),
              modeling = modeler.get('modeling');

        const definitions = modeler.getDefinitions();

        const {
          executionPlatform,
          executionPlatformVersion
        } = engineProfile;

        modeling.updateModdleProperties(canvas.getRootElement(), definitions, {
          'modeler:executionPlatform': executionPlatform,
          'modeler:executionPlatformVersion': executionPlatformVersion
        });
      },
      getCached: () => this.getCached(),
      setCached: (state) => this.setCached(state)
    });

    this.handleResize = debounce(this.handleResize);

    this.handleLintingDebounced = debounce(this.handleLinting.bind(this));
  }

  async componentDidMount() {
    this._isMounted = true;

    const {
      layout
    } = this.props;

    const modeler = this.getModeler();

    this.listen('on');

    // modeler.attachTo(this.ref.current);

    const minimap = modeler.get('minimap');

    if (layout.minimap) {
      minimap.toggle(layout.minimap && !!layout.minimap.open);
    }

    const propertiesPanel = modeler.get('propertiesPanel');

    // propertiesPanel.attachTo(this.propertiesPanelRef.current);


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

    if (prevProps.linting !== this.props.linting) {
      this.getModeler().get('linting').setErrors(this.props.linting || []);
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
      'searchPad.opened',
      'popupMenu.opened',
      'popupMenu.closed'
    ].forEach((event) => {
      modeler[fn](event, this.handleChanged);
    });

    modeler[fn]('elementTemplates.errors', this.handleElementTemplateErrors);

    modeler[fn]('error', 1500, this.handleError);

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);

    if (fn === 'on') {
      modeler[ fn ]('commandStack.changed', LOW_PRIORITY, this.handleLintingDebounced);
    } else if (fn === 'off') {
      modeler[ fn ]('commandStack.changed', this.handleLintingDebounced);
    }
  }

  async loadTemplates() {
    const { getConfig } = this.props;

    const modeler = this.getModeler();

    const templatesLoader = modeler.get('elementTemplatesLoader');

    let templates = await getConfig('bpmn.elementTemplates');

    templatesLoader.setTemplates(getCloudTemplates(templates));
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
      onWarning
    } = this.props;

    const {
      errors
    } = event;

    errors.forEach(error => {
      onWarning({ message: error.message });
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

    let engineProfile = null;

    try {
      engineProfile = this.engineProfile.get(true);
    } catch (err) {
      error = err;
    }

    if (error) {
      this.setCached({
        defaultTemplatesApplied: false,
        engineProfile: null,
        lastXML: null
      });
    } else {
      if (isNew && !defaultTemplatesApplied) {
        modeler.invoke(applyDefaultTemplates);

        defaultTemplatesApplied = true;
      }

      this.setCached({
        defaultTemplatesApplied,
        engineProfile,
        lastXML: xml,
        stackIdx
      });

      this.handleLinting();
    }

    this.setState({
      importing: false
    });

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
      platform: 'cloud',
      propertiesPanel: true,
      redo: commandStack.canRedo(),
      removeSelected: !!selectionLength || inputActive,
      replaceElement: !!selectionLength && selectionLength == 1 && !inputActive,
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

    try {
      const engineProfile = this.engineProfile.get();

      this.engineProfile.setCached(engineProfile);
    } catch (err) {

      // TODO
    }
  };

  handleLinting = () => {
    const {
      engineProfile,
      modeler
    } = this.getCached();

    if (!engineProfile) {
      return;
    }

    const contents = modeler.getDefinitions();

    const { onAction } = this.props;

    onAction('lint-tab', { contents });
  };

  isLintingActive = () => {
    return this.getModeler().get('linting').isActive();
  };

  handleToggleLinting = () => {
    const { onLayoutChanged } = this.props;

    const linting = this.getModeler().get('linting');

    if (linting.isActive()) {
      linting.deactivate();

      onLayoutChanged({
        panel: {
          open: false,
          tab: 'linting'
        }
      });
    } else {
      linting.activate();

      onLayoutChanged({
        panel: {
          open: true,
          tab: 'linting'
        }
      });
    }
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

    const { xml } = this.props;

    this.importXML(xml);
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

  async importXML(xml) {
    this.setState({
      importing: true
    });

    const modeler = this.getModeler();

    let error = null, warnings = null;
    try {

      const result = await modeler.importXML(xml);
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
   * @returns {BpmnModeler}
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

    if (!this.isDirty()) {
      return lastXML || this.props.xml;
    }

    try {
      const { xml } = await modeler.saveXML({ format: true });

      const stackIdx = commandStack._stackIdx;

      this.setCached({ lastXML: xml, stackIdx });

      return xml;
    } catch (error) {
      this.handleError({ error });

      return Promise.reject(error);
    }
  }

  async exportAs(type) {
    let svg;

    try {
      svg = await this.exportSVG();
    } catch (error) {
      this.handleError({ error });

      return Promise.reject(error);
    }

    if (type === 'svg') {
      return svg;
    }

    return generateImage(type, svg);
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

  triggerAction = (action, context = {}) => {
    const {
      layout = {}
    } = this.props;

    const {
      propertiesPanel: propertiesPanelLayout = {}
    } = layout;

    const modeler = this.getModeler();

    if (action === 'resize') {
      return this.handleResize();
    }

    if (action === 'toggleProperties') {
      const newLayout = {
        propertiesPanel: {
          ...propertiesPanelDefaultLayout,
          ...propertiesPanelLayout,
          open: !propertiesPanelLayout.open
        }
      };

      return this.handleLayoutChange(newLayout);
    }

    if (action === 'resetProperties') {
      const newLayout = {
        propertiesPanel: {
          ...propertiesPanelDefaultLayout,
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

    if (action === 'showLintError') {
      this.getModeler().get('linting').showError(context);

      return;
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
    const engineProfile = this.engineProfile.getCached();

    const {
      layout,
      linting = [],
      onAction,
      onLayoutChanged,
      onUpdateMenu
    } = this.props;

    const imported = this.getModeler().getDefinitions();

    const {
      importing
    } = this.state;

    return (
      <div className={ css.BpmnEditor }>

        <Chat />

        {/* <Loader hidden={ imported && !importing } /> */}

        {/* <div className="editor">
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
        </div> */}

        { engineProfile && <EngineProfile
          type="bpmn"
          engineProfile={ engineProfile }
          onChange={ (engineProfile) => this.engineProfile.set(engineProfile) } />
        }

        {
          engineProfile && <Fragment>
            <Panel
              layout={ layout }
              onUpdateMenu={ onUpdateMenu }>
              <LintingTab
                layout={ layout }
                linting={ linting }
                onAction={ onAction }
                onLayoutChanged={ onLayoutChanged } />
            </Panel>
            <Linting
              layout={ layout }
              linting={ linting }
              onToggleLinting={ this.handleToggleLinting } />
          </Fragment>
        }
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
      onError,
      layout = {}
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
    }, handleMiddlewareExtensions, 'cloud');

    if (warnings.length && isFunction(onError)) {
      onError(
        'Problem(s) configuring BPMN editor: \n\t' +
        warnings.map(error => error.message).join('\n\t') +
        '\n'
      );
    }

    const modeler = new BpmnModeler({
      ...options,
      position: 'absolute',
      changeTemplateCommand: 'propertiesPanel.zeebe.changeTemplate',
      linting: {
        active: layout.panel && layout.panel.open && layout.panel.tab === 'linting'
      },
      propertiesPanel: {
        feelTooltipContainer: '.editor'
      }
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
        // modeler.destroy();
      },
      engineProfile: null,
      lastXML: null,
      modeler,
      stackIdx,
      templatesLoaded: false
    };
  }

}


export default WithCache(WithCachedState(BpmnEditor));

// helpers //////////

function isCacheStateChanged(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}

function Chat() {
  const [ messageIndex, setMessageIndex ] = useState(chat.startMessageIndex || 0);
  const [ userMessage, setUserMessage ] = useState('');

  const onKeypress = useCallback(async ({ key }) => {
    if (key === 'Escape') {
      setMessageIndex(chat.startMessageIndex || 0);
      setUserMessage('');

      return;
    }

    if (key !== ' ' || messageIndex === chat.messages.length) return;

    const message = chat.messages[ messageIndex ];

    if (message.prompt) {

      // user types message
      setUserMessage(message.prompt);

      await wait(message.prompt.length * 50 + 2000);

      console.log('user pressed ENTER');

      // user presses ENTER
      setUserMessage('');
      setMessageIndex(messageIndex + 1);
    } else {
      setMessageIndex(messageIndex + 1);
    }

  }, [ messageIndex, setMessageIndex, setUserMessage ]);

  useEffect(() => {
    window.addEventListener('keyup', onKeypress);

    return () => window.removeEventListener('keyup', onKeypress);
  }, [ onKeypress ]);

  return <div className="editor">
    <div className="chat">
      <div className="chat-inner">
        {
          chat.intro && chat.intro.length ? (
            <Message
              key={ 'message-intro' }
              message={ chat.intro }
              className="chat-message chat-message-bot"
              type="bot" />
          ) : null
        }
        {
          chat.messages.slice(0, messageIndex).map(({ prompt, response }, index) => {
            return (
              <Message
                key={ 'message' + index }
                message={ prompt || response }
                className={ `chat-message chat-message-${prompt ? 'user' : 'bot'}` }
                type={ prompt ? 'user' : 'bot' }
                typeWrite={ index > (chat.startMessageIndex || -1) && response } />
            );
          })
        }
      </div>
      <a
        href="http://bpmn.io"
        target="_blank"
        className="bjs-powered-bya"
        title="Powered by bpmn.io"
        style={ {
          color: 'rgb(64, 64, 64)'
        } }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.02 5.57" width="53" height="21"
          style={ { verticalAlign: 'middle' } }
        >
          <path fill="currentColor" d="M1.88.92v.14c0 .41-.13.68-.4.8.33.14.46.44.46.86v.33c0 .61-.33.95-.95.95H0V0h.95c.65 0 .93.3.93.92zM.63.57v1.06h.24c.24 0 .38-.1.38-.43V.98c0-.28-.1-.4-.32-.4zm0 1.63v1.22h.36c.2 0 .32-.1.32-.39v-.35c0-.37-.12-.48-.4-.48H.63zM4.18.99v.52c0 .64-.31.98-.94.98h-.3V4h-.62V0h.92c.63 0 .94.35.94.99zM2.94.57v1.35h.3c.2 0 .3-.09.3-.37v-.6c0-.29-.1-.38-.3-.38h-.3zm2.89 2.27L6.25 0h.88v4h-.6V1.12L6.1 3.99h-.6l-.46-2.82v2.82h-.55V0h.87zM8.14 1.1V4h-.56V0h.79L9 2.4V0h.56v4h-.64zm2.49 2.29v.6h-.6v-.6zM12.12 1c0-.63.33-1 .95-1 .61 0 .95.37.95 1v2.04c0 .64-.34 1-.95 1-.62 0-.95-.37-.95-1zm.62 2.08c0 .28.13.39.33.39s.32-.1.32-.4V.98c0-.29-.12-.4-.32-.4s-.33.11-.33.4z"></path><path fill="currentColor" d="M0 4.53h14.02v1.04H0zM11.08 0h.63v.62h-.63zm.63 4V1h-.63v2.98z">
          </path>
        </svg>
      </a>
    </div>
    <div className="input">
      <Input message={ userMessage } />
    </div>
  </div>;
}

function Message(props) {
  const {
    className,
    message,
    type,
    typeWrite
  } = props;

  const typedMessage = useTypewriter(message, null, 2000);

  return <div className={ className }>
    <div className="icon">
      {
        type === 'bot' ? <BotIcon /> : <UserIcon />
      }
    </div>
    <div className="message">{ typeWrite ? typedMessage : message }</div>
  </div>;
}

function useTypewriter(message, ref = null, delay = 0) {
  const timeout = 50;

  const [ typedMessage, setTypedMessage ] = useState('');

  useEffect(() => {
    if (!delay) return;

    let i = 0;

    const placeholder = '...';

    function typeWrite() {
      if (i <= placeholder.length) {
        setTypedMessage(placeholder.substring(0, i));

        i++;

        setTimeout(typeWrite, delay / placeholder.length);
      }
    }

    typeWrite();
  }, []);

  useEffect(() => {
    let i = 0;

    function typeWrite() {
      if (i <= message.length) {
        setTypedMessage(message.substring(0, i));

        if (ref && ref.current) resizeToContents(ref.current);

        i++;

        setTimeout(typeWrite, timeout * (Math.random() + 0.5));
      }
    }

    wait(delay).then(typeWrite);
  }, [ message ]);

  return delay && !typedMessage.length ? '...' : typedMessage;
}

function Input(props) {
  const { message } = props;

  const ref = useRef();

  const typedMessage = useTypewriter(message, ref);

  return <div className="input-inner">
    <textarea
      ref={ ref }
      rows="2"
      spellCheck="false" value={ typedMessage } placeholder="Send a message..." />
  </div>;
}

function wait(ms = 300) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function resizeToContents(element) {
  element.style.height = 'auto';

  // a 2px pixel offset is required to prevent scrollbar from
  // appearing on OS with a full length scroll bar (Windows/Linux)
  element.style.height = `${ element.scrollHeight + 2 }px`;
}

/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment } from 'react';
import classnames from 'classnames';

import { Overlay } from '../../shared/ui';
import { Fill } from '../slot-fill';

import LinkArrow from '../../../resources/icons/LinkArrow.svg';
import css from './EngineProfile.less';

// todo: save in config / file
// const EXECUTION_CONFIG = 'executionEnabled';


export function EngineProfile(props) {
  const {
    tab,
    onAction,
    onEvent
  } = props;

  const [ open, setOpen ] = React.useState(false, []);
  const [ executionEnabled, setExecutionEnabled ] = React.useState(false, []);

  const buttonRef = React.useRef(null);

  const engineProfile = tab.meta && tab.meta.engineProfile;

  if (!engineProfile) {
    return null;
  }

  // @pinussilvestrus: user test hack, no cleanups
  onEvent('engineProfile.open', function() {
    setOpen(true);
  });


  return (
    <Fill slot="status-bar__file" group="1_engine">
      {
        open &&
        <EngineProfileOverlay
          anchor={ buttonRef.current }
          onClose={ () => setOpen(false) }
          engineProfile={ engineProfile }
          executionEnabled={ executionEnabled }
          setExecutionEnabled={ setExecutionEnabled }
          onAction={ onAction }
        />
      }
      <button
        className={ classnames('btn', { 'btn--active': open }) }
        onClick={ () => setOpen(val => !val) } ref={ buttonRef }
        title={ 'Display engine profile information' }
      >
        {executionEnabled ? engineProfile : 'No engine profile'}
      </button>
    </Fill>
  );
}

function EngineProfileOverlay(props) {
  const {
    anchor,

    // tab
    // setConfigForFile,
    onClose,
    engineProfile,
    executionEnabled,
    setExecutionEnabled,
    onAction
  } = props;


  // todo: get from config / file
  // const { file } = tab;
  // const [ executionEnabled, setExecutionEnabled ] = React.useState(false);

  const toggleExecution = async () => {

    // todo: save state

    // ensure tab is saved
    // if (!file.path) {
    //   await onAction('save');
    // }

    // await setConfigForFile(EXECUTION_CONFIG, !executionEnabled);

    // enable / disable properties
    onAction('toggleExecutionProperties');

    setExecutionEnabled(!executionEnabled);

    onClose();
  };

  return (
    <Overlay anchor={ anchor } onClose={ onClose }>
      <Description
        engineProfile={ engineProfile }
        executionEnabled={ executionEnabled }
        onToggleExecution={ toggleExecution } />
    </Overlay>
  );
}

function Description(props) {
  const {
    engineProfile,
    onToggleExecution,
    executionEnabled
  } = props;

  if (engineProfile === 'Camunda Platform') {
    return (
      <Fragment>
        <Overlay.Body>
          This diagram is supposed to be executed on <em>Camunda Platform</em>.
          The properties panel provides the related implementation features.
          This diagram can be deployed to and started in a connected <em>Camunda Platform</em> instance.
        </Overlay.Body>
        <Overlay.Footer>
          <Link href="https://docs.camunda.org/manual/latest/">Learn more</Link>
        </Overlay.Footer>
      </Fragment>
    );
  } else if (engineProfile === 'Camunda Cloud') {
    return (
      <Fragment>
        <Overlay.Body>
          { executionEnabled ?
            <div>
              This diagram is supposed to be executed on <em>Camunda Cloud</em>.
              The properties panel provides the related implementation features.
              This diagram can be deployed to and started in a connected <em>Camunda Cloud</em> instance.
            </div>
            : (
              <div>
                <p style={ { marginTop: '0' } }>Select the execution platform</p>
                <div className="form-group">
                  <div>
                    <div className="custom-control custom-radio">
                      <input
                        type="radio"
                        name="cloud"
                        value="cloud"
                        autoFocus={ false }
                        onChange={ () => {} }
                        className="custom-control-input"
                        id="cloud" />
                      <label
                        htmlFor="cloud"
                        className="custom-control-label">
                        Camunda Cloud
                        <br />
                        (Zeebe Workflow Engine)
                      </label>
                    </div>
                  </div>
                  <div>
                    <div className="custom-control custom-radio">
                      <input
                        type="radio"
                        name="platform"
                        value="platform"
                        disabled={ true }
                        className="custom-control-input"
                        id="platform" />
                      <label
                        htmlFor="platform"
                        className="custom-control-label">
                        Camunda Platform
                        <br />
                        (Camunda Workflow Engine)
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  style={ { height: '30px', width: '100%', marginTop: '1rem' } }
                  className="btn btn-primary"
                  onClick={ onToggleExecution }>Apply</button>
              </div>
            )
          }

        </Overlay.Body>
        <Overlay.Footer>
          <Link href="https://docs.camunda.io/">Learn more</Link>

          {/* <span>Execution Properties</span>
          <div style={ { marginTop: '1em' } } className="bio-properties-panel-toggle-switch">
            <div className="bio-properties-panel-field-wrapper">
              <label className="bio-properties-panel-toggle-switch__switcher">
                <input
                  type="checkbox"
                  onChange={ onToggleExecution }
                  checked={ executionEnabled } />
                <span className="bio-properties-panel-toggle-switch__slider" />
              </label>
              <p style={ { fontSize: '14px' } } className="bio-properties-panel-toggle-switch__label">Visibility</p>
            </div>
          </div> */}
        </Overlay.Footer>
      </Fragment>
    );
  } else if (engineProfile === 'Camunda Platform or Cloud') {
    return (
      <Fragment>
        <Overlay.Body>
          This form is supposed to be used with <em>Camunda Platform</em> or <em>Camunda Cloud</em>.
          The properties panel provides the related implementation features.
          This form can be attached to a BPMN diagram or deployment
          and gets rendered in a connected Camunda Tasklist.
        </Overlay.Body>
        <Overlay.Footer>
          <Link href="https://docs.camunda.org/manual/latest/">Learn more</Link>
        </Overlay.Footer>
      </Fragment>
    );
  }
}

function Link(props) {
  const {
    href,
    children
  } = props;

  return (
    <a className={ css.Link } href={ href }>
      { children }
      <LinkArrow />
    </a>
  );
}

/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment, useState } from 'react';
import classnames from 'classnames';

import { Overlay } from '../../shared/ui';
import { Fill } from '../slot-fill';

import LinkArrow from '../../../resources/icons/LinkArrow.svg';
import css from './EngineProfile.less';

import parseExecutionPlatform from '../util/parseExecutionPlatform';

import { isNil } from 'min-dash';


export function EngineProfile(props) {
  const {
    tab,
    triggerAction,
    xml
  } = props;

  const {
    meta = {}
  } = tab;

  const { contentType } = meta;

  const engineProfile = parseExecutionPlatform(xml, contentType);

  const [ open, setOpen ] = React.useState(false, []);
  const buttonRef = React.useRef(null);

  return (
    <Fill slot="status-bar__file" group="1_engine">
      {
        open &&
        <EngineProfileOverlay
          anchor={ buttonRef.current }
          engineProfile={ engineProfile }
          onClose={ () => setOpen(false) }
          tab={ tab }
          triggerAction={ triggerAction }
        />
      }
      <button
        className={ classnames('btn', { 'btn--active': open }) }
        onClick={ () => setOpen(val => !val) } ref={ buttonRef }
        title={ 'Display engine profile information' }
      >
        {
          engineProfile
            ? `${ engineProfile.executionPlatform } ${ engineProfile.executionPlatformVersion }`
            : 'Set Execution Platform'
        }
      </button>
    </Fill>
  );
}

function EngineProfileOverlay(props) {
  const {
    anchor,
    onClose,
    engineProfile,
    tab,
    triggerAction
  } = props;

  return (
    <Overlay anchor={ anchor } onClose={ onClose }>
      <Description
        engineProfile={ engineProfile }
        onClose={ onClose }
        tab={ tab }
        triggerAction={ triggerAction } />
    </Overlay>
  );
}

function Description(props) {
  const {
    engineProfile,
    onClose,
    tab,
    triggerAction
  } = props;

  const {
    meta,
    type
  } = tab;

  const [ selectedEngineProfile, setSelectedEngineProfile ] = useState(engineProfile);

  const onSelectEngineProfile = (newExecutionPlatform, newExecutionPlatformVersion) => {
    const newEngineProfile = {
      executionPlatform: newExecutionPlatform,
      executionPlatformVersion: newExecutionPlatformVersion
    };

    if (engineProfilesEqual(selectedEngineProfile, newEngineProfile)) {
      setSelectedEngineProfile(null);
    } else {
      setSelectedEngineProfile({
        executionPlatform: newExecutionPlatform,
        executionPlatformVersion: newExecutionPlatformVersion
      });
    }
  };

  if (type === 'form') {
    const setEngineProfile = () => {
      if (engineProfilesEqual(selectedEngineProfile, engineProfile)) {
        return;
      }

      triggerAction('setExecutionPlatform', selectedEngineProfile);

      onClose();
    };

    return (
      <Fragment>
        <Overlay.Body>
          <legend>
            Select the Execution Platform
          </legend>

          <div className="form-group form-inline">
            {
              [
                [ 'Camunda Platform', '7.15' ],
                [ 'Camunda Cloud', '1.0' ],
                [ 'Camunda Cloud', '1.1' ],
              ].map(([ executionPlatform, executionPlatformVersion ]) => {
                const optionEngineProfile = {
                  executionPlatform,
                  executionPlatformVersion
                };

                const id = `execution-platform-${ executionPlatform }-${ executionPlatformVersion }`;

                const checked = engineProfilesEqual(selectedEngineProfile, optionEngineProfile);

                return <p
                  className="custom-control custom-radio"
                  key={ `${ executionPlatform} ${ executionPlatformVersion }` }>
                  <input
                    id={ id }
                    className="custom-control-input"
                    type="radio"
                    checked={ checked }
                    onClick={ () => onSelectEngineProfile(executionPlatform, executionPlatformVersion) } />
                  <label className="custom-control-label" htmlFor={ id }>
                    { `${ executionPlatform } ${ executionPlatformVersion }` }
                  </label>
                </p>;
              })
            }
            <button className="btn btn-primary" onClick={ setEngineProfile } disabled={ isNil(selectedEngineProfile) }>Apply</button>
          </div>
        </Overlay.Body>
        <Overlay.Footer>
          <Link href="https://docs.camunda.org/manual/latest/">Learn more</Link>
        </Overlay.Footer>
      </Fragment>
    );
  }

  if (meta && meta.engineProfile === 'Camunda Platform') {
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
  } else if (meta && meta.engineProfile === 'Camunda Cloud') {
    return (
      <Fragment>
        <Overlay.Body>
          This diagram is supposed to be executed on <em>Camunda Cloud</em>.
          The properties panel provides the related implementation features.
          This diagram can be deployed to and started in a connected <em>Camunda Cloud</em> instance.
        </Overlay.Body>
        <Overlay.Footer>
          <Link href="https://docs.camunda.io/">Learn more</Link>
        </Overlay.Footer>
      </Fragment>
    );
  } else if (meta && meta.engineProfile === 'Camunda Platform or Cloud') {
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

function engineProfilesEqual(a, b) {
  return !isNil(a)
    && !isNil(b)
    && a.executionPlatform === b.executionPlatform
    && a.executionPlatformVersion === b.executionPlatformVersion;
}
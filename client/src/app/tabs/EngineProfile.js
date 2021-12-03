/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useRef } from 'react';

import classnames from 'classnames';

import {
  Overlay,
  Section
} from '../../shared/ui';

import { Fill } from '../slot-fill';

import { ENGINES, ENGINE_PROFILES } from '../../util/Engines';

import css from './EngineProfile.less';

const HELP_LINKS = {
  [ ENGINES.PLATFORM ]: 'https://docs.camunda.org/manual/latest/',
  [ ENGINES.CLOUD ]: 'https://docs.camunda.io/'
};

export function EngineProfile(props) {
  const {
    engineProfile,
    onChange = null
  } = props;

  const [ open, setOpen ] = useState(false, []);
  const buttonRef = useRef(null);

  if (!engineProfile) {
    throw new Error('<engineProfile> required');
  }

  const engineProfileForExecutionPlatform = ENGINE_PROFILES.find(p => p.executionPlatform === engineProfile.executionPlatform);

  const engineProfileVersions = engineProfileForExecutionPlatform && engineProfileForExecutionPlatform.executionPlatformVersions;

  if (!engineProfileVersions) {
    throw new Error('<engineProfileVersions: string[]> not found');
  }

  const {
    executionPlatform,
    executionPlatformVersion
  } = engineProfile;

  const label = `${ executionPlatform } ${ toSemverMinor(executionPlatformVersion) || '' }`;

  const handleChange = onChange ? (engineProfile) => {
    onChange(engineProfile);
    setOpen(false);
  } : null;

  const toggle = () => setOpen(open => !open);

  return (
    <Fill slot="status-bar__file" group="1_engine">
      {
        open &&
        <EngineProfileOverlay
          anchor={ buttonRef.current }
          onClose={ () => setOpen(false) }
          engineProfile={ engineProfile }
          engineProfileVersions={ engineProfileVersions }
          onChange={ handleChange }
        />
      }
      <button
        className={ classnames('btn', { 'btn--active': open }) }
        onClick={ toggle } ref={ buttonRef }
        title={ handleChange ? 'Change execution platform' : 'Display execution platform information' }
      >
        { label }
      </button>
    </Fill>
  );
}

function EngineProfileOverlay(props) {
  const {
    anchor,
    onClose,
    onChange
  } = props;

  return (
    <Overlay anchor={ anchor } onClose={ onClose } className={ css.EngineProfileOverlay }>

      {
        onChange
          ? <EditableVersionSection { ...props } />
          : <ReadonlyVersionSection { ...props } />
      }
    </Overlay>
  );
}


function EditableVersionSection(props) {

  const {
    engineProfile: _engineProfile,
    engineProfileVersions,
    onChange
  } = props;

  if (!onChange) {
    throw new Error('<onChange> required');
  }

  if (!_engineProfile) {
    throw new Error('<engineProfile> required');
  }

  if (!engineProfileVersions) {
    throw new Error('<engineProfileVersions> required');
  }

  const [ engineProfile, setEngineProfile ] = useState(_engineProfile);

  const handleVersionChanged = event => {
    const executionPlatformVersion = event.target.value;

    setEngineProfile({
      executionPlatform: engineProfile.executionPlatform,
      executionPlatformVersion: executionPlatformVersion || undefined
    });
  };

  const handleApply = (e) => {
    onChange(engineProfile);

    e.preventDefault();
  };

  return (
    <Section>
      <Section.Header>
        Select the { engineProfile.executionPlatform } version
      </Section.Header>
      <Section.Body>
        <form onSubmit={ handleApply } className="fields">
          <div className="form-group">
            <label htmlFor="engineProfile.version">Version</label>

            <select
              className="form-control"
              onChange={ handleVersionChanged }
              value={ engineProfile.executionPlatformVersion || '' }
              name="engineProfile.version">
              {
                isKnownVersion(engineProfileVersions, engineProfile.executionPlatformVersion)
                  ? null
                  : <option value={ engineProfile.executionPlatformVersion || '' }>{ engineProfile.executionPlatformVersion || '<unset>' }</option>
              }
              {
                engineProfileVersions.map(version => {
                  return (
                    <option key={ version } value={ version }>
                      { toSemverMinor(version) }
                    </option>
                  );
                })
              }
            </select>
          </div>

          <PlatformHint className="form-group form-description" executionPlatform={ engineProfile.executionPlatform } />

          <Section.Actions>
            <button className="btn btn-primary" type="submit">Apply</button>
          </Section.Actions>
        </form>
      </Section.Body>
    </Section>
  );
}


function ReadonlyVersionSection(props) {

  const {
    engineProfile
  } = props;

  return (
    <Section>
      <Section.Header>
        { engineProfile.executionPlatform }
      </Section.Header>
      <Section.Body>
        <form>
          <PlatformHint
            className="form-control form-description"
            executionPlatform={ engineProfile.executionPlatform } />
        </form>
      </Section.Body>
    </Section>
  );
}


function PlatformHint(props) {
  const {
    executionPlatform,
    className
  } = props;

  return (
    <div className={ className }>
      This file can be deployed and executed on { executionPlatform }.
      The properties panel provides the related implementation features. <a href={ HELP_LINKS[executionPlatform] }>
        Learn more
      </a>
    </div>
  );
}

function getExecutionPlatformHash(a) {
  return `${a && a.executionPlatform || 'undefined'}#${a && toSemver(a.executionPlatformVersion) || 'undefined' }`;
}

export function engineProfilesEqual(a, b) {
  return getExecutionPlatformHash(a) === getExecutionPlatformHash(b);
}

export function isKnownVersion(knownVersions, version) {
  const minorVersion = toSemverMinor(version);

  return knownVersions.some(version => minorVersion === toSemverMinor(version));
}

export function isKnownEngineProfile(engineProfile = {}) {

  const {
    executionPlatform,
    executionPlatformVersion
  } = engineProfile;

  if (!executionPlatform) {
    return false;
  }

  // <platform> not known
  const existingEngineProfile = ENGINE_PROFILES.find(profile => profile.executionPlatform === executionPlatform);

  if (!existingEngineProfile) {
    return false;
  }

  if (!executionPlatformVersion) {
    return true;
  }

  const knownVersions = existingEngineProfile.executionPlatformVersions;

  // <version> set but not known
  //
  // we do compare via minor versions only
  // and assume that all patch versions are known
  if (!isKnownVersion(knownVersions, executionPlatformVersion)) {
    return false;
  }

  return true;
}


/**
 * @param {ModdleElement} definitions
 * @param { { executionPlatform: string, executionPlatformVersion: string } } defaultProfile
 *
 * @return { { executionPlatform?: string, executionPlatformVersion?: string } }
 */
export function getEngineProfileFromBpmn(definitions, defaultProfile) {

  if (!definitions) {
    return {
      ...defaultProfile
    };
  }

  return {
    executionPlatform: definitions.get('modeler:executionPlatform') || defaultProfile.executionPlatform,
    executionPlatformVersion: toSemver(definitions.get('modeler:executionPlatformVersion') || defaultProfile.executionPlatformVersion)
  };
}

export function getEngineProfileFromForm(schema, defaultProfile) {

  if (!schema) {
    return {
      ...defaultProfile
    };
  }

  return {
    executionPlatform: schema.executionPlatform || defaultProfile.executionPlatform,
    executionPlatformVersion: toSemver(schema.executionPlatformVersion || defaultProfile.executionPlatformVersion)
  };
}

/**
 * Ensure the given version string is a major.minor.patch
 * semantic version string or null.
 *
 * This allows us to handle versions consistently.
 *
 * @param {string|undefined} versionString
 *
 * @return {string|undefined}
 */
export function toSemver(versionString) {

  if (!versionString) {
    return undefined;
  }

  const parts = versionString.split(/\./);

  while (parts.length < 3) {
    parts.push('0');
  }

  return parts.join('.');
}

/**
 * Strip patch version of a major.minor.patch
 * semver identifier.
 *
 * @param {string|null} string
 * @return {string|null}
 */
function toSemverMinor(string) {
  return string && string.split(/\./).slice(0, 2).join('.');
}

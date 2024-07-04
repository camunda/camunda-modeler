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

import semverCompare from 'semver-compare';


import Flags, {
  PLATFORM_ENGINE_VERSION,
  CLOUD_ENGINE_VERSION
} from '../../util/Flags';

import {
  Overlay,
  Section
} from '../../shared/ui';

import { Fill } from '../slot-fill';

import { ENGINES, ENGINE_LABELS, ENGINE_PROFILES, getLatestStable } from '../../util/Engines';

const HELP_LINKS = {
  [ ENGINES.PLATFORM ]: 'https://docs.camunda.org/manual/latest/',
  [ ENGINES.CLOUD ]: 'https://docs.camunda.io/?utm_source=modeler&utm_medium=referral'
};

const DONWLOAD_PAGE = 'https://camunda.com/download/modeler/';

export function EngineProfile(props) {
  const {
    filterVersions = () => true,
    engineProfile,
    onChange = null
  } = props;

  const [ open, setOpen ] = useState(false, []);
  const buttonRef = useRef(null);

  if (!engineProfile) {
    throw new Error('<engineProfile> required');
  }

  const engineProfileForExecutionPlatform = ENGINE_PROFILES.find(p => p.executionPlatform === engineProfile.executionPlatform);

  const engineProfileVersions = engineProfileForExecutionPlatform && engineProfileForExecutionPlatform.executionPlatformVersions.filter(filterVersions);

  if (!engineProfileVersions) {
    throw new Error('<engineProfileVersions: string[]> not found');
  }

  const label = getStatusBarLabel(engineProfile);

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
    <Overlay anchor={ anchor } onClose={ onClose }>

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
    const executionPlatformVersion = toSemver(event.target.value);

    setEngineProfile({
      executionPlatform: engineProfile.executionPlatform,
      executionPlatformVersion: executionPlatformVersion || undefined
    });
  };

  const handleApply = (e) => {
    onChange(engineProfile);

    e.preventDefault();
  };

  const {
    executionPlatform
  } = engineProfile;

  const engineLabel = ENGINE_LABELS[executionPlatform];
  const name = 'engineProfile.version';

  const currentMinorVersion = toSemverMinor(engineProfile.executionPlatformVersion);
  const minorVersions = engineProfileVersions.map(toSemverMinor);

  const versionRecognized = isKnownVersion(engineProfileVersions, engineProfile.executionPlatformVersion);

  return (
    <Section>
      <Section.Header>
        Select the { engineLabel } version
      </Section.Header>
      <Section.Body>
        <form onSubmit={ handleApply } className="fields">
          <div className="form-group">
            <label htmlFor={ name }>Version</label>

            <select
              className="form-control"
              onChange={ handleVersionChanged }
              value={ currentMinorVersion || '' }
              id={ name }
              name={ name }>
              {
                versionRecognized
                  ? null
                  : <option value={ currentMinorVersion || '' }>{ currentMinorVersion ? `${currentMinorVersion} (unsupported)` : '<unset>' }</option>
              }
              {
                minorVersions.map(version => {
                  return (
                    <option key={ version } value={ version }>
                      { getAnnotatedVersion(version, executionPlatform) }
                    </option>
                  );
                })
              }
            </select>
          </div>

          {(versionRecognized || !currentMinorVersion) ?
            <PlatformHint className="form-group form-description" executionPlatform={ executionPlatform } displayLabel={ engineLabel } /> :
            <UnknownVersionHint className="form-group form-description" executionPlatform={ executionPlatform } executionPlatformVersion={ engineProfile.executionPlatformVersion } displayLabel={ engineLabel } />
          }

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

  const engineLabel = ENGINE_LABELS[engineProfile.executionPlatform];

  return (
    <Section>
      <Section.Header>
        { engineLabel }
      </Section.Header>
      <Section.Body>
        <form>
          <PlatformHint
            className="form-control form-description"
            executionPlatform={ engineProfile.executionPlatform }
            displayLabel={ engineLabel } />
        </form>
      </Section.Body>
    </Section>
  );
}

function PlatformHint(props) {
  const {
    executionPlatform,
    displayLabel,
    className
  } = props;

  return (
    <div className={ className }>
      This file can be deployed and executed on { displayLabel }.
      The properties panel provides the related implementation features. <a href={ HELP_LINKS[executionPlatform] }>
        Learn more
      </a>
    </div>
  );
}

function UnknownVersionHint(props) {
  const {
    displayLabel,
    className
  } = props;

  return (
    <div className={ className }>
      <p>
        This diagram uses an unsupported { displayLabel } version.
        As a result, some features might not work as expected.
      </p>

      <p>
        To use the latest features, please <a href={ DONWLOAD_PAGE }>
          check for an updated modeler version
        </a>.
      </p>
    </div>
  );
}

function getExecutionPlatformHash(a) {
  return `${a && a.executionPlatform || 'undefined'}#${a && toSemver(a.executionPlatformVersion) || 'undefined' }`;
}

export function getStatusBarLabel(engineProfile) {

  const {
    executionPlatformVersion,
    executionPlatform
  } = engineProfile;

  if (!executionPlatformVersion) {
    return `${ENGINE_LABELS[executionPlatform]}`;
  } else if (executionPlatformVersion.startsWith('1.')) {
    return `${ENGINE_LABELS[executionPlatform]} (Zeebe ${toSemverMinor(executionPlatformVersion)})`;
  } else {
    return `Camunda ${toDisplayVersion(engineProfile)}`;
  }
}

export function getAnnotatedVersion(version, platform) {
  if (version.startsWith('1.')) {
    return 'Zeebe ' + version;
  }

  if (platform && isAlpha(version, platform)) {
    return version + ' (alpha)';
  }

  return version;
}

export function getDefaultVersion(engine) {
  const flagVersion = getFlagVersion(engine);

  const versions = getVersions(engine);
  if (isKnownVersion(versions, flagVersion)) {
    return flagVersion;
  }

  return getLatestStable(engine);
}

function getFlagVersion(engine) {
  if (engine === ENGINES.PLATFORM) {
    return Flags.get(PLATFORM_ENGINE_VERSION);
  } else if (engine === ENGINES.CLOUD) {
    return Flags.get(CLOUD_ENGINE_VERSION);
  }
}

function getVersions(engine) {
  return ENGINE_PROFILES.find(profile => profile.executionPlatform === engine).executionPlatformVersions;
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
export function toSemverMinor(string) {
  return string && string.split(/\./).slice(0, 2).join('.');
}

function toDisplayVersion(engineProfile) {
  const {
    executionPlatformVersion,
    executionPlatform
  } = engineProfile;

  const version = toSemverMinor(executionPlatformVersion);

  if (!isKnownEngineProfile(engineProfile)) {
    return `${version} (unsupported)`;
  }

  if (executionPlatform && isAlpha(version, executionPlatform)) {
    return `${version} (alpha)`;
  }

  return version;
}


/**
 * Checks if the given version is an alpha of the selected platform.
 *
 * @param {string} version
 * @param {string} platform
 * @return {boolean} isAlpha
 */
function isAlpha(version, platform) {
  const latest = getLatestStable(platform);

  return semverCompare(version, latest) > 0;
}

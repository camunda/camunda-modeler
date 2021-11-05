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

import LinkArrow from '../../../resources/icons/LinkArrow.svg';

import css from './EngineProfile.less';

import { ENGINES, ENGINE_PROFILES } from '../../util/Engines';

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

  const engineProfileVersions = ENGINE_PROFILES.find(p => p.executionPlatform === engineProfile.executionPlatform).executionPlatformVersions;

  if (!engineProfileVersions) {
    throw new Error('<engineProfileVersions: string[]> not found');
  }

  const {
    executionPlatform,
    executionPlatformVersion
  } = engineProfile;

  const label = `${ executionPlatform } ${ executionPlatformVersion || '' }`;

  const handleChange = onChange ? (engineProfile) => {
    onChange(engineProfile);
    setOpen(false);
  } : null;

  const toggle = () => setOpen(open => !open);

  return (
    <Fill slot="status-bar__file" group="1_engine">
      {
        open &&
        <EngineProfileSelect
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
        title={ 'Change execution platform' }
      >
        { label }
      </button>
    </Fill>
  );
}

function EngineProfileSelect(props) {
  const {
    anchor,
    engineProfile,
    engineProfileVersions,
    onClose,
    onChange
  } = props;

  return (
    <Overlay anchor={ anchor } onClose={ onClose } className={ css.EngineProfileSelect }>

      <PlatformHintSection executionPlatform={ engineProfile.executionPlatform } />

      { onChange && <VersionChooserSection
        engineProfile={ engineProfile }
        engineProfileVersions={ engineProfileVersions }
        onChange={ onChange } /> }

    </Overlay>
  );
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

function VersionChooserSection(props) {

  const {
    engineProfile: _engineProfile,
    engineProfileVersions,
    onChange
  } = props;

  if (!onChange) {
    throw new Error('<onChange> required');
  }

  if (!engineProfileVersions) {
    throw new Error('<engineProfileVersions> required');
  }

  const [ engineProfile, setEngineProfile ] = useState(_engineProfile);

  const handleVersionChanged = event => {
    const executionPlatformVersion = event.target.value;

    setEngineProfile({
      executionPlatform: engineProfile.executionPlatform,
      executionPlatformVersion: executionPlatformVersion
    });
  };

  const handleApply = () => {
    onChange(engineProfile);
  };

  return (
    <Section>
      <Section.Header>
        Select the { engineProfile.executionPlatform } version
      </Section.Header>
      <Section.Body>
        <select
          className="form-control"
          onChange={ handleVersionChanged }
          value={ engineProfile.executionPlatformVersion || '' }>
          {
            engineProfileVersions.map(version => {
              return (
                <option key={ version } value={ version }>
                  { version }
                </option>
              );
            })
          }
        </select>

        <Section.Actions>
          <button className="btn btn-primary" type="submit" onClick={ handleApply }>Apply</button>
        </Section.Actions>
      </Section.Body>
    </Section>
  );
}


function PlatformHintSection(props) {
  const {
    executionPlatform
  } = props;

  if (executionPlatform === ENGINES.CLOUD) {
    return (
      <Section>
        <Section.Body>
          <p>
            This diagram is supposed to be executed on <em>Camunda Cloud</em>.
            The properties panel provides the related implementation features.
            This diagram can be deployed to and started in a connected <em>Camunda Cloud</em> instance.
          </p>

          <p>
            <Link href={ HELP_LINKS[executionPlatform] }>Learn more</Link>
          </p>
        </Section.Body>
      </Section>
    );
  } else {
    return (
      <Section>
        <Section.Body>
          <p>
            This diagram is supposed to be executed on <em>Camunda Platform</em>.
            The properties panel provides the related implementation features.
            This diagram can be deployed to and started in a connected <em>Camunda Platform</em> instance.
          </p>

          <p>
            <Link href={ HELP_LINKS[executionPlatform] }>Learn more</Link>
          </p>
        </Section.Body>
      </Section>
    );
  }
}

function getExecutionPlatformHash(a) {
  return `${a && a.executionPlatform || 'undefined'}#${a && toSemver(a.executionPlatformVersion) || 'undefined' }`;
}

export function engineProfilesEqual(a, b) {
  return getExecutionPlatformHash(a) === getExecutionPlatformHash(b);
}

export function isKnownEngineProfile(engineProfile = {}) {

  const {
    executionPlatform,
    executionPlatformVersion
  } = engineProfile;

  console.log(engineProfile);

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

  const versions = [
    executionPlatformVersion,
    toSemverMinor(executionPlatformVersion)
  ];

  // <version> set but not known
  if (!knownVersions.some(version => versions.includes(version))) {
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
 * @param {string|null} versionString
 *
 * @return {string|null}
 */
export function toSemver(versionString) {

  if (!versionString) {
    return null;
  }

  const parts = versionString.split(/\./g);

  while (parts.length < 3) {
    parts.push('0');
  }

  return parts.join('.');
}

export function toKebapCase(string) {
  return string.replace(/\s/, '-').toLowerCase();
}

/**
 * Strip patch version of a major.minor.patch
 * semver identifier.
 *
 * @param {string|null} string
 * @return {string|null}
 */
function toSemverMinor(string) {
  return string && string.replace(/\.\d+$/, '.0');
}

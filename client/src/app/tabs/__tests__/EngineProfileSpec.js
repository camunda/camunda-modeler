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

import React from 'react';

import { render, fireEvent } from '@testing-library/react';

import {
  SlotFillRoot,
  Slot
} from '../../slot-fill';

import { EngineProfile, getAnnotatedVersion, getStatusBarLabel, toSemverMinor } from '../EngineProfile';

import { ENGINES, ENGINE_PROFILES } from '../../../util/Engines';

import { DEFAULT_ENGINE_PROFILE as bpmnEngineProfile } from '../bpmn/BpmnEditor';
import { DEFAULT_ENGINE_PROFILE as cloudBpmnEngineProfile } from '../cloud-bpmn/BpmnEditor';
import { DEFAULT_ENGINE_PROFILE as dmnEngineProfile } from '../dmn/DmnEditor';
import { DEFAULT_ENGINE_PROFILE as cloudDmnEngineProfile } from '../cloud-dmn/DmnEditor';
import { DEFAULT_ENGINE_PROFILE as formEngineProfile } from '../form/FormEditor';
import { utmTag } from '../../../util/utmTag';

const spy = sinon.spy;


describe('<EngineProfile>', function() {

  it('should render', function() {

    // given
    const { getByRole } = renderEngineProfile({
      engineProfile: bpmnEngineProfile
    });

    // then
    expect(getByRole('button')).to.exist;
  });


  it('should open', function() {

    // given
    const { getByText, getByRole } = renderEngineProfile({
      engineProfile: bpmnEngineProfile
    });

    // when
    const button = getByRole('button');
    fireEvent.click(button);

    // then
    expect(getByText(/This file can be deployed and executed on Camunda 7/)).to.exist;
  });


  it('should close', function() {

    // given
    const { getByRole, queryByRole } = renderEngineProfile({
      engineProfile: bpmnEngineProfile
    });

    const button = getByRole('button');
    fireEvent.click(button);

    // when
    fireEvent.click(button);

    // then
    const overlay = queryByRole('dialog');
    expect(overlay).to.not.exist;
  });


  it('should filter versions', function() {

    // given
    const { getByRole } = renderEngineProfile({
      engineProfile: { ...cloudDmnEngineProfile, executionPlatformVersion: '8.0.0' },
      onChange: () => {},
      filterVersions: version => version === '8.0.0'
    });

    // when
    const button = getByRole('button');
    fireEvent.click(button);

    // then
    const select = getByRole('combobox');
    const options = select.querySelectorAll('option');
    expect(options.length).to.equal(1);
  });


  describe('show selected engine profile', function() {

    eachProfile((executionPlatform, executionPlatformVersion) => {

      it(`should show selected engine profile (${executionPlatform} ${executionPlatformVersion})`, function() {

        // given
        const { getByRole } = renderEngineProfile({
          engineProfile: {
            executionPlatform,
            executionPlatformVersion,
          },
          onChange: () => { }
        });

        // when
        const button = getByRole('button');
        fireEvent.click(button);

        // then
        const select = getByRole('combobox');
        expect(select).to.exist;

        expectVersion(select, toSemverMinor(executionPlatformVersion));
      });

    });

  });


  describe('set engine profile', function() {

    eachProfile((executionPlatform, executionPlatformVersion) => {

      it(`should set engine profile (${executionPlatform} ${executionPlatformVersion})`, function() {

        // given
        const onChangeSpy = spy();

        const { getByRole } = renderEngineProfile({
          engineProfile: {
            executionPlatform,
            executionPlatformVersion: null
          },
          onChange: onChangeSpy
        });

        const button = getByRole('button');
        fireEvent.click(button);

        // when
        selectVersion(getByRole('combobox'), executionPlatformVersion);

        // then
        expect(onChangeSpy).to.have.been.calledOnce;

        expect(onChangeSpy).to.have.been.calledWith({
          executionPlatform,
          executionPlatformVersion
        });
      });

    });

  });


  describe('#getAnnotatedVersion', function() {

    it('should return correct annotated versions', function() {

      // given
      const inputs =
      [ [ ENGINES.CLOUD, '1.0', 'Zeebe 1.0' ],
        [ ENGINES.CLOUD, '1.2', 'Zeebe 1.2' ],
        [ ENGINES.CLOUD, '8.0', '8.0' ],
        [ ENGINES.CLOUD, '8.1', '8.1' ],
        [ ENGINES.CLOUD, '8.100', '8.100 (alpha)' ],
        [ ENGINES.PLATFORM, '7.14', '7.14' ],
        [ ENGINES.PLATFORM, '7.500', '7.500 (alpha)' ],
        [ undefined, '10.0', '10.0' ],
      ];

      // then
      inputs.forEach((input) => {
        expect(getAnnotatedVersion(input[1], input[0])).to.equal(input[2]);
      });

    });

  });

  describe('#getStatusBarLabel', function() {

    it('should return correct annotated versions', function() {

      // given
      const inputs =
      [ [ ENGINES.PLATFORM, '7.0', 'Camunda 7.0 (unsupported)' ],
        [ ENGINES.PLATFORM, '7.15', 'Camunda 7.15' ],
        [ ENGINES.PLATFORM, '7.500', 'Camunda 7.500 (unsupported)' ],
        [ ENGINES.PLATFORM, '', 'Camunda 7' ],
        [ ENGINES.CLOUD, '1.3', 'Camunda 8 (Zeebe 1.3)' ],
        [ ENGINES.CLOUD, '8.1', 'Camunda 8.1' ],
        [ ENGINES.CLOUD, '8.100', 'Camunda 8.100 (unsupported)' ],
        [ ENGINES.CLOUD, '', 'Camunda 8' ] ];

      // then
      inputs.forEach((input) => {
        expect(getStatusBarLabel({
          executionPlatform: input[0],
          executionPlatformVersion: input[1]
        })).to.equal(input[2]);
      });

    });

  });


  describe('BPMN', function() {

    it('should show description', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: bpmnEngineProfile
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectPlatformHelp(getByRole);
    });


    it('should show selection', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: bpmnEngineProfile,
        onChange: () => { }
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectPlatformHelp(getByRole);
    });

  });


  describe('Cloud BPMN', function() {

    it('should show description', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: cloudBpmnEngineProfile
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectCloudHelp(getByRole);
    });


    it('should show selection', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: cloudBpmnEngineProfile,
        onChange: () => { }
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectCloudHelp(getByRole);
    });

  });


  describe('DMN', function() {

    it('should show description', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: dmnEngineProfile
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectPlatformHelp(getByRole);
    });


    it('should show selection', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: dmnEngineProfile,
        onChange: () => { }
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectPlatformHelp(getByRole);
    });

  });


  describe('Cloud DMN', function() {

    it('should show description', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: cloudDmnEngineProfile
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectCloudHelp(getByRole);
    });


    it('should show selection', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: cloudDmnEngineProfile,
        onChange: () => { }
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectCloudHelp(getByRole);
    });
  });


  describe('Form', function() {

    it('should show description', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: formEngineProfile
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectPlatformHelp(getByRole);
    });


    it('should show selection', function() {

      // given
      const { getByRole } = renderEngineProfile({
        engineProfile: formEngineProfile,
        onChange: () => { }
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expectPlatformHelp(getByRole);
    });

  });

});


// helpers //////////

function renderEngineProfile(options = {}) {
  const {
    type,
    engineProfile,
    onChange,
    ...rest
  } = options;

  return render(
    <SlotFillRoot>
      <Slot name="status-bar__file" />
      <EngineProfile
        type={ type }
        engineProfile={ engineProfile }
        onChange={ onChange }
        { ...rest } />
    </SlotFillRoot>
  );
}


function eachProfile(fn) {
  ENGINE_PROFILES.forEach(({ executionPlatform, executionPlatformVersions }) => {
    [
      undefined,
      ...executionPlatformVersions,
      ...executionPlatformVersions
    ].forEach((executionPlatformVersion) => {
      fn(executionPlatform, executionPlatformVersion);
    });
  });
}


function expectHelpText(getByRole, helpLink) {
  const link = getByRole('link');
  expect(link).to.exist;
  expect(link.getAttribute('href')).to.equal(helpLink);
}

function expectCloudHelp(getByRole) {
  expectHelpText(getByRole, utmTag('https://docs.camunda.io/'));
}

function expectPlatformHelp(getByRole) {
  expectHelpText(getByRole, utmTag('https://docs.camunda.org/manual/latest/'));
}

function selectVersion(select, version) {
  if (select.value !== version) {
    fireEvent.change(select, { target: { value: toSemverMinor(version) || '' } });
  }

  const form = select.closest('form');
  fireEvent.submit(form);
}

function expectVersion(select, version) {
  expect(select.value).to.equal(version || '');
}
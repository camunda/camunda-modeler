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

import { mount } from 'enzyme';

import {
  SlotFillRoot,
  Slot
} from '../../slot-fill';

import {
  EngineProfile,
  engineProfiles,
  toKebapCase
} from '../EngineProfile';

import { engineProfile as bpmnEngineProfile } from '../bpmn/BpmnEditor';
import { engineProfile as cloudBpmnEngineProfile } from '../cloud-bpmn/BpmnEditor';
import { engineProfile as dmnEngineProfile } from '../dmn/DmnEditor';

import Flags, { DISABLE_ZEEBE, DISABLE_PLATFORM } from '../../../util/Flags';

const spy = sinon.spy;

const allEngineProfiles = engineProfiles.reduce((allEngineProfiles, engineProfile) => {
  const {
    executionPlatform,
    executionPlatformVersions
  } = engineProfile;

  executionPlatformVersions.forEach((executionPlatformVersion) => {
    allEngineProfiles.push({
      executionPlatform,
      executionPlatformVersion
    });
  });

  return allEngineProfiles;
}, []);


describe('<EngineProfile>', function() {

  let wrapper;

  afterEach(function() {
    if (wrapper && wrapper.exists()) {
      wrapper.unmount();
    }
  });


  it('should render', function() {

    // given
    wrapper = renderEngineProfile({
      type: 'bpmn',
      engineProfile: {
        executionPlatform: 'Camunda Platform'
      }
    });

    // then
    expect(wrapper.exists()).to.be.true;
  });


  it('should open', function() {

    // given
    wrapper = renderEngineProfile({
      type: 'bpmn',
      engineProfile: {
        executionPlatform: 'Camunda Platform'
      }
    });

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
  });


  it('should close', function() {

    // given
    wrapper = renderEngineProfile({
      type: 'bpmn',
      engineProfile: {
        executionPlatform: 'Camunda Platform'
      }
    });

    wrapper.find('button').simulate('click');

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('EngineProfileOverlay').exists()).to.be.false;
  });


  describe('BPMN', function() {

    it('should show description', function() {

      // given
      wrapper = renderEngineProfile({
        type: 'bpmn',
        engineProfile: bpmnEngineProfile
      });

      // when
      wrapper.find('button').simulate('click');

      // then
      expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
      expect(wrapper.find('EngineProfileDescription').exists()).to.be.true;
      expect(wrapper.find('Link').exists()).to.be.true;
      expect(wrapper.find('Link').prop('href')).to.equal('https://docs.camunda.org/manual/latest/');
    });

  });


  describe('Cloud BPMN', function() {

    it('should show description', function() {

      // given
      wrapper = renderEngineProfile({
        type: 'cloud-bpmn',
        engineProfile: cloudBpmnEngineProfile
      });

      // when
      wrapper.find('button').simulate('click');

      // then
      expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
      expect(wrapper.find('EngineProfileDescription').exists()).to.be.true;
      expect(wrapper.find('Link').exists()).to.be.true;
      expect(wrapper.find('Link').prop('href')).to.equal('https://docs.camunda.io/');
    });

  });


  describe('DMN', function() {

    it('should show description', function() {

      // given
      wrapper = renderEngineProfile({
        type: 'dmn',
        engineProfile: dmnEngineProfile
      });

      // when
      wrapper.find('button').simulate('click');

      // then
      expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
      expect(wrapper.find('EngineProfileDescription').exists()).to.be.true;
      expect(wrapper.find('Link').exists()).to.be.true;
      expect(wrapper.find('Link').prop('href')).to.equal('https://docs.camunda.org/manual/latest/');
    });

  });


  describe('Form', function() {

    it('should show selection', function() {

      // given
      wrapper = renderEngineProfile({
        type: 'form'
      });

      // when
      wrapper.find('button').simulate('click');

      // then
      expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
      expect(wrapper.find('EngineProfileSelection').exists()).to.be.true;
      expect(wrapper.find('Link').exists()).to.be.true;
      expect(wrapper.find('Link').prop('href')).to.equal('https://docs.camunda.org/manual/latest/');
    });


    describe('show selected engine profile', function() {

      allEngineProfiles.forEach(({ executionPlatform, executionPlatformVersion }) => {

        it(`should show selected engine profile (${ executionPlatform } ${ executionPlatformVersion })`, function() {

          // given
          wrapper = renderEngineProfile({
            type: 'form',
            engineProfile: {
              executionPlatform,
              executionPlatformVersion
            }
          });

          // when
          wrapper.find('button').simulate('click');

          // then
          expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
          expect(wrapper.find('EngineProfileSelection').exists()).to.be.true;

          const input = wrapper.find('input').filterWhere((item) => item.prop('id') === `execution-platform-${ toKebapCase(executionPlatform) }`);

          expect(input.prop('checked')).to.be.true;

          const select = wrapper.find('select').filterWhere((item) => item.prop('id') === `execution-platform-version-${ toKebapCase(executionPlatform) }`);

          expect(select.prop('value')).to.equal(executionPlatformVersion);
        });

      });

    });


    describe('not show disabled engine profile', function() {

      afterEach(sinon.restore);

      it('should not show Cloud if DISABLE_ZEEBE ', function() {

        // given
        sinon.stub(Flags, 'get').withArgs(DISABLE_ZEEBE).returns(true);

        wrapper = renderEngineProfile({
          type: 'form',
          engineProfile: {
            executionPlatform:'Camunda Platform',
            executionPlatformVersion:'7.16'
          }
        });

        // when
        wrapper.find('button').simulate('click');

        // then
        expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
        expect(wrapper.find('EngineProfileSelection').exists()).to.be.true;

        const platformInput = wrapper.find('label').filterWhere((item) => item.prop('htmlFor') === `execution-platform-${ toKebapCase('Camunda Platform') }`);
        expect(platformInput.exists()).to.be.true;

        const cloudInput = wrapper.find('label').filterWhere((item) => item.prop('htmlFor') === `execution-platform-${ toKebapCase('Camunda Cloud') }`);
        expect(cloudInput.exists()).to.be.false;

      });


      it('should not show Platform if DISABLE_PLATFORM ', function() {

        // given
        sinon.stub(Flags, 'get').withArgs(DISABLE_PLATFORM).returns(true);

        wrapper = renderEngineProfile({
          type: 'form',
          engineProfile: {
            executionPlatform:'Camunda Cloud',
            executionPlatformVersion:'1.2'
          }
        });

        // when
        wrapper.find('button').simulate('click');

        // then
        expect(wrapper.find('EngineProfileOverlay').exists()).to.be.true;
        expect(wrapper.find('EngineProfileSelection').exists()).to.be.true;


        const cloudInput = wrapper.find('label').filterWhere((item) => item.prop('htmlFor') === `execution-platform-${ toKebapCase('Camunda Cloud') }`);
        expect(cloudInput.exists()).to.be.true;

        const platformInput = wrapper.find('label').filterWhere((item) => item.prop('htmlFor') === `execution-platform-${ toKebapCase('Camunda Platform') }`);
        expect(platformInput.exists()).to.be.false;
      });

    });


    describe('set engine profile', function() {

      allEngineProfiles.forEach(({ executionPlatform, executionPlatformVersion }) => {

        it(`should set engine profile (${ executionPlatform } ${ executionPlatformVersion })`, function() {

          // given
          const setEngineProfileSpy = spy();

          wrapper = renderEngineProfile({
            type: 'form',
            setEngineProfile: setEngineProfileSpy
          });

          wrapper.find('button').simulate('click');

          // when
          const input = wrapper.find('input').filterWhere((item) => item.prop('id') === `execution-platform-${ toKebapCase(executionPlatform) }`);

          input.simulate('click');

          const select = wrapper.find('select').filterWhere((item) => item.prop('id') === `execution-platform-version-${ toKebapCase(executionPlatform) }`);

          if (select.instance().value !== executionPlatformVersion) {
            select.simulate('change', { target: { value : executionPlatformVersion } });
          }

          wrapper.find('.apply').simulate('click');

          // then
          expect(setEngineProfileSpy).to.have.been.calledOnce;
          expect(setEngineProfileSpy).to.have.been.calledWith({
            executionPlatform,
            executionPlatformVersion
          });
        });

      });

    });


    describe('error', function() {

      it('should show error if no engine profile selected', function() {

        // given
        const setEngineProfileSpy = spy();

        wrapper = renderEngineProfile({
          type: 'form',
          setEngineProfile: setEngineProfileSpy
        });

        wrapper.find('button').simulate('click');

        // when
        wrapper.find('.apply').simulate('click');

        // then
        expect(setEngineProfileSpy).not.to.have.been.called;

        expect(wrapper.find('.error').exists()).to.be.true;
      });


      it('should hide error if engine profile selected', function() {

        // given
        const setEngineProfileSpy = spy();

        wrapper = renderEngineProfile({
          type: 'form',
          setEngineProfile: setEngineProfileSpy
        });

        wrapper.find('button').simulate('click');

        wrapper.find('.apply').simulate('click');

        // assume
        expect(setEngineProfileSpy).not.to.have.been.called;

        expect(wrapper.find('.error').exists()).to.be.true;

        // when
        wrapper.find('input').filterWhere((item) => item.prop('id') === 'execution-platform-camunda-platform').simulate('click');

        // then
        expect(wrapper.find('.error').exists()).to.be.false;
      });

    });

  });

});


// helpers //////////

function renderEngineProfile(options = {}) {
  const {
    type,
    engineProfile,
    setEngineProfile
  } = options;

  return mount(
    <SlotFillRoot>
      <Slot name="status-bar__file" />
      <EngineProfile
        type={ type }
        engineProfile={ engineProfile }
        setEngineProfile={ setEngineProfile } />
    </SlotFillRoot>
  );
}

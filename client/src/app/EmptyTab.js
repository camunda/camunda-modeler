/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import CloudIcon from '../../resources/icons/Cloud.svg';
import PlatformIcon from '../../resources/icons/Platform.svg';
import BPMNIcon from '../../resources/icons/file-types/BPMN.svg';
import DMNIcon from '../../resources/icons/file-types/DMN.svg';
import FormIcon from '../../resources/icons/file-types/Form.svg';

import css from './EmptyTab.less';

import {
  Tab
} from './primitives';

import Flags, { DISABLE_DMN, DISABLE_FORM, DISABLE_ZEEBE, DISABLE_PLATFORM } from '../util/Flags';


export default class EmptyTab extends PureComponent {

  componentDidMount() {
    this.props.onShown();
  }

  triggerAction() { }

  renderDiagramButton = (action, title, icon) => {

    const {
      onAction
    } = this.props;

    return (
      <button className="btn btn-secondary" onClick={ () => onAction(action) }>
        {icon}
        {title}
      </button>
    );
  };

  renderCloudColumn = () => {

    return (
      <div id="welcome-page-cloud" className="welcome-card relative">
        <div className="engine-info">
          <div className="engine-info-heading">
            <CloudIcon className="engine-icon cloud-icon" />
            <h3>Camunda 8</h3>
          </div>
          <a href="https://camunda.com/products/cloud/?utm_source=modeler&utm_medium=referral">See version details</a>
        </div>

        <p>Create a new file</p>

        {this.renderDiagramButton('create-cloud-bpmn-diagram', 'BPMN diagram', <BPMNIcon />)}
        {
          !Flags.get(DISABLE_DMN) && (
            this.renderDiagramButton('create-cloud-dmn-diagram', 'DMN diagram', <DMNIcon />)
          )
        }
        {
          !Flags.get(DISABLE_FORM) && (
            this.renderDiagramButton('create-cloud-form', 'Form', <FormIcon />)
          )
        }
      </div>
    );
  };

  renderPlatformColumn = () => {

    return (
      <div id="welcome-page-platform" className="welcome-card">
        <div className="engine-info">
          <div className="engine-info-heading">
            <PlatformIcon className="engine-icon platform-icon" />
            <h3>Camunda 7</h3>
          </div>
          <a href="https://camunda.com/products/camunda-platform/?utm_source=modeler&utm_medium=referral">See version details</a>
        </div>

        <p>Create a new file</p>

        {this.renderDiagramButton('create-bpmn-diagram', 'BPMN diagram', <BPMNIcon />)}
        {
          !Flags.get(DISABLE_DMN) && (
            this.renderDiagramButton('create-dmn-diagram', 'DMN diagram', <DMNIcon />)
          )
        }
        {
          !Flags.get(DISABLE_FORM) && (
            this.renderDiagramButton('create-form', 'Form', <FormIcon />)
          )
        }
      </div>
    );
  };

  renderLearnMoreColumn = () => {

    return (
      <div id="welcome-page-learn-more" className="welcome-card">
        <div className="learn-more">
          <h3>Learn more</h3>
          <div className="article relative">
            <p>Introduction to Camunda 8</p>
            <a href="https://camunda.com/blog/2022/04/camunda-platform-8-orchestrate-all-the-things?utm_source=modeler&utm_medium=referral">Read blog post</a>
          </div>
          <div className="article relative">
            <p>Migrating from Camunda 7</p>
            <a href="https://docs.camunda.io/docs/guides/migrating-from-Camunda-Platform/">Camunda Docs</a>
          </div>
          <div className="article">
            <p>About Modeler 5</p>
            <a href="#" onClick={ () => this.props.onAction('emit-event', { type: 'versionInfo.open' }) }>Open "What's new"</a>
          </div>
          <div className="article">
            <p>Model your first diagram</p>
            <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/model-your-first-diagram/">Camunda Modeler Docs</a>
          </div>
        </div>
      </div>
    );
  };

  render() {

    return (
      <Tab className={ css.EmptyTab }>
        {!Flags.get(DISABLE_ZEEBE) && !Flags.get(DISABLE_PLATFORM) && <h2 className="welcome-header">Choose the right version for your project:</h2>}
        <div className="welcome-cards">
          {!Flags.get(DISABLE_ZEEBE) && <>{this.renderCloudColumn()}<div className="flex-spacer" /></>}
          {!Flags.get(DISABLE_PLATFORM) && <>{this.renderPlatformColumn()}<div className="flex-spacer" /></>}
          {this.renderLearnMoreColumn()}
        </div>
      </Tab>
    );
  }
}

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
import AiIcon from '../../resources/icons/Ai.svg';

import { utmTag } from '../util/utmTag';

import * as css from './EmptyTab.less';

import {
  Tab
} from './primitives';

import Flags, { DISABLE_ZEEBE, DISABLE_PLATFORM } from '../util/Flags';


export default class EmptyTab extends PureComponent {

  componentDidMount() {
    this.props.onShown();
  }

  triggerAction() { }

  renderDiagramButton = (key, entry) => {
    const {
      onAction
    } = this.props;

    return (
      <button key={ key } className="btn btn-secondary" onClick={ () => onAction(entry.action, entry.options) }>
        {entry.icon && <entry.icon />}
        {entry.label}
      </button>
    );
  };

  /**
   * @param {string} group
   *
   * @return {React.JSX.Element[]}
   */
  getCreateButtons(group) {
    const providers = this.props.tabsProvider?.getProviders() || {};

    const tabs = Object.values(providers)
      .flatMap(tab => tab.getNewFileMenu && tab.getNewFileMenu().map(entry => ({ ...entry, icon: tab.getIcon() })))
      .filter(entry => entry?.group === group)
      .map((entry, index) => {
        return this.renderDiagramButton(index, entry);
      });

    return tabs;
  }

  renderCloudColumn = () => {

    const createButtons = this.getCreateButtons('Camunda 8');

    return (
      <div id="welcome-page-cloud" className="welcome-card relative" data-testid="welcome-page-cloud">
        <div className="engine-info">
          <div className="engine-info-heading">
            <CloudIcon className="engine-icon cloud-icon" />
            <h3>Camunda 8</h3>
          </div>
          <a href={ utmTag('https://camunda.com/products/cloud/') }>See version details</a>
        </div>

        <p>Create a new file</p>

        {createButtons}
      </div>
    );
  };

  renderPlatformColumn = () => {

    const createButtons = this.getCreateButtons('Camunda 7');

    return (
      <div id="welcome-page-platform" className="welcome-card" data-testid="welcome-page-platform">
        <div className="engine-info">
          <div className="engine-info-heading">
            <PlatformIcon className="engine-icon platform-icon" />
            <h3>Camunda 7</h3>
          </div>
          <a href={ utmTag('https://camunda.com/products/camunda-platform/') }>See version details</a>
        </div>

        <p>Create a new file</p>

        {createButtons}
      </div>
    );
  };

  renderLearnMoreColumn = () => {

    return (
      <div id="welcome-page-learn-more" className="welcome-card">
        <div className="learn-more">
          <h3>Learn more</h3>
          <div className="article top">
            <AiIcon />
            <a href={ utmTag('https://docs.camunda.io/docs/guides/getting-started-agentic-orchestration') }>Build your first AI agent</a>
          </div>
          <div className="article relative">
            <p>Introduction to Camunda 8</p>
            <a href={ utmTag('https://camunda.com/blog/2022/04/camunda-platform-8-orchestrate-all-the-things') }>Read blog post</a>
          </div>
          <div className="article relative">
            <p>Migrating from Camunda 7</p>
            <a href={ utmTag('https://docs.camunda.io/docs/guides/migrating-from-Camunda-Platform/') }>Camunda Docs</a>
          </div>
          <div className="article">
            <p>About Modeler 5</p>
            <a href="#" onClick={ () => this.props.onAction('emit-event', { type: 'versionInfo.open' }) }>Open &quot;What&apos;s new&quot;</a>
          </div>
          <div className="article">
            <p>Model your first diagram</p>
            <a href={ utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/model-your-first-diagram/') }>Camunda Modeler Docs</a>
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
          {!Flags.get(DISABLE_ZEEBE) && <>{this.renderCloudColumn()}</>}
          {!Flags.get(DISABLE_PLATFORM) && <>{this.renderPlatformColumn()}</>}
          {this.renderLearnMoreColumn()}
        </div>
      </Tab>
    );
  }
}


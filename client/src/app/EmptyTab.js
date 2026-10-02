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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Heading,
  Link,
  Text
} from '@camunda/design-system';

import { ArrowRight } from '@camunda/design-system/icons';

import CloudIcon from '../../resources/icons/Cloud.svg';
import PlatformIcon from '../../resources/icons/Platform.svg';
import AiIcon from '../../resources/icons/Ai.svg';

import { utmTag } from '../util/utmTag';

import * as css from './EmptyTab.css';

import {
  Tab
} from './primitives';

import Flags, { DISABLE_ZEEBE, DISABLE_PLATFORM } from '../util/Flags';

const FILE_TYPES = {
  'BPMN diagram': { type: 'bpmn', description: 'Model and automate a process' },
  'DMN diagram': { type: 'dmn', description: 'Define a business decision' },
  'Form': { type: 'form', description: 'Design a form for a user task' },
  'RPA script': { type: 'rpa', description: 'Automate a task in a desktop or web app' }
};

const ARTICLES = [
  {
    title: 'Introduction to Camunda 8',
    label: 'Read blog post',
    href: utmTag('https://camunda.com/blog/2022/04/camunda-platform-8-orchestrate-all-the-things')
  },
  {
    title: 'Migrating from Camunda 7',
    label: 'Camunda Docs',
    href: utmTag('https://docs.camunda.io/docs/guides/migrating-from-Camunda-Platform/')
  },
  {
    title: 'About Modeler 5',
    label: 'Open "What\'s new"',
    event: 'versionInfo.open'
  },
  {
    title: 'Model your first diagram',
    label: 'Camunda Modeler Docs',
    href: utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/model-your-first-diagram/')
  }
];


export default class EmptyTab extends PureComponent {

  componentDidMount() {
    this.props.onShown(this.props.tab);
  }

  triggerAction() { }

  renderDiagramButton = (key, entry) => {
    const {
      onAction
    } = this.props;

    const { type, description } = FILE_TYPES[entry.label] || {};

    return (
      <button
        key={ key }
        type="button"
        className="welcome-tile"
        data-file-type={ type }
        onClick={ () => onAction(entry.action, entry.options) }
      >
        <span className="welcome-tile__icon">
          {entry.icon && <entry.icon aria-hidden="true" />}
        </span>
        <span className="welcome-tile__text">
          <span className="welcome-tile__label">{entry.label}</span>
          {description && <span className="welcome-tile__description">{description}</span>}
        </span>
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

  renderEngineCard({ id, title, icon: Icon, docsUrl, group }) {
    return (
      <Card id={ id } className="welcome-engine" data-testid={ id }>
        <CardHeader className="welcome-engine__header">
          <span className="welcome-engine__icon">
            { /* the svg loader strips the viewBox, which is needed to scale the illustration */ }
            <Icon viewBox="0 0 80 64" aria-hidden="true" />
          </span>
          <div>
            <Heading as="h3" variant="heading-sm">{ title }</Heading>
            <CardDescription>
              <Link inline href={ docsUrl }>See documentation</Link>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="welcome-tiles">
          { this.getCreateButtons(group) }
        </CardContent>
      </Card>
    );
  }

  renderPromo() {
    return (
      <aside className="welcome-promo">
        <AiIcon className="welcome-promo__icon" aria-hidden="true" />
        <div className="welcome-promo__text">
          <Text as="p" variant="label-md-strong">Build your first AI agent</Text>
          <Text as="p" variant="body-subtle">Orchestrate AI agents with BPMN and Camunda 8.</Text>
        </div>
        <Link href={ utmTag('https://docs.camunda.io/docs/guides/getting-started-agentic-orchestration') }>
          Get started
          <ArrowRight aria-hidden="true" />
        </Link>
      </aside>
    );
  }

  renderLearnMore() {
    return (
      <section className="welcome-learn" id="welcome-page-learn-more">
        <Heading as="h3" variant="heading-sm">Learn more</Heading>
        <ul className="welcome-learn__articles">
          {
            ARTICLES.map(({ title, label, href, event }) => (
              <li key={ title }>
                <Text as="p" variant="body-subtle">{ title }</Text>
                <Link
                  inline
                  href={ href || '#' }
                  onClick={ event ? () => this.props.emit(event) : undefined }
                >
                  { label }
                </Link>
              </li>
            ))
          }
        </ul>
      </section>
    );
  }

  render() {

    return (
      <Tab className={ css.EmptyTab }>
        <div className="welcome">
          <Heading as="h2" variant="heading-md" className="welcome__title">What do you want to create today?</Heading>
          <div className="welcome-engines">
            {
              !Flags.get(DISABLE_ZEEBE) && this.renderEngineCard({
                id: 'welcome-page-cloud',
                title: 'Camunda 8',
                icon: CloudIcon,
                docsUrl: utmTag('https://docs.camunda.io/'),
                group: 'Camunda 8'
              })
            }
            {
              !Flags.get(DISABLE_PLATFORM) && this.renderEngineCard({
                id: 'welcome-page-platform',
                title: 'Camunda 7',
                icon: PlatformIcon,
                docsUrl: utmTag('https://docs.camunda.org/'),
                group: 'Camunda 7'
              })
            }
          </div>
          { this.renderPromo() }
          { this.renderLearnMore() }
        </div>
      </Tab>
    );
  }
}


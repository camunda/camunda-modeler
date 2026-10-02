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
  CardHeader,
  Heading,
  Link,
  Separator,
  Text
} from '@camunda/design-system';

import CloudIcon from '../../resources/icons/Cloud.svg';
import PlatformIcon from '../../resources/icons/Platform.svg';
import AiIcon from '../../resources/icons/Ai.svg';

import { utmTag } from '../util/utmTag';

import * as css from './EmptyTab.css';

import {
  Tab
} from './primitives';

import Flags, { DISABLE_ZEEBE, DISABLE_PLATFORM } from '../util/Flags';

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

    return (
      <button
        key={ key }
        type="button"
        className="welcome-tile"
        onClick={ () => onAction(entry.action, entry.options) }
      >
        <span className="welcome-tile__icon">
          {entry.icon && <entry.icon aria-hidden="true" />}
        </span>
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

  renderEngineCard({ id, title, icon: Icon, iconViewBox, docsUrl, group }) {
    return (
      <Card id={ id } className="welcome-card" data-testid={ id }>
        <CardHeader className="welcome-card__header welcome-card__header--centered welcome-card__section">
          <span className="welcome-card__title">
            <Icon className="welcome-card__icon" viewBox={ iconViewBox } aria-hidden="true" />
            <Heading as="h3" variant="heading-sm">{ title }</Heading>
          </span>
          <Link inline href={ docsUrl }>See documentation</Link>
        </CardHeader>
        <CardContent className="welcome-card__content welcome-card__section">
          <Text as="p" variant="body-subtle">Create a new file</Text>
          <div className="welcome-card__actions">
            { this.getCreateButtons(group) }
          </div>
        </CardContent>
      </Card>
    );
  }

  renderLearnMoreCard() {
    return (
      <Card id="welcome-page-learn-more" className="welcome-card">
        <CardHeader className="welcome-card__header welcome-card__section">
          <span className="welcome-card__title">
            <Heading as="h3" variant="heading-sm">Learn more</Heading>
          </span>
          <div className="welcome-article welcome-article--featured">
            <AiIcon aria-hidden="true" />
            <Link inline href={ utmTag('https://docs.camunda.io/docs/guides/getting-started-agentic-orchestration') }>
              Build your first AI agent
            </Link>
          </div>
        </CardHeader>
        <CardContent className="welcome-card__articles welcome-card__section">
          <Separator />
          {
            ARTICLES.map(({ title, label, href, event }) => (
              <div key={ title } className="welcome-article">
                <Text as="p">{ title }</Text>
                <Link
                  inline
                  href={ href || '#' }
                  onClick={ event ? () => this.props.emit(event) : undefined }
                >
                  { label }
                </Link>
              </div>
            ))
          }
        </CardContent>
      </Card>
    );
  }

  render() {

    return (
      <Tab className={ css.EmptyTab }>
        <div className="welcome">
          <Heading as="h2" variant="heading-md">What do you want to create today?</Heading>
          <div className="welcome-cards">
            {
              !Flags.get(DISABLE_ZEEBE) && this.renderEngineCard({
                id: 'welcome-page-cloud',
                title: 'Camunda 8',
                icon: CloudIcon,
                iconViewBox: '9 10 62 45',
                docsUrl: utmTag('https://docs.camunda.io/'),
                group: 'Camunda 8'
              })
            }
            {
              !Flags.get(DISABLE_PLATFORM) && this.renderEngineCard({
                id: 'welcome-page-platform',
                title: 'Camunda 7',
                icon: PlatformIcon,
                iconViewBox: '19 11 41 41',
                docsUrl: utmTag('https://docs.camunda.org/'),
                group: 'Camunda 7'
              })
            }
            { this.renderLearnMoreCard() }
          </div>
        </div>
      </Tab>
    );
  }
}

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

import classNames from 'classnames';

import {
  Badge,
  Button,
  CamundaLogo,
  CodeBlock,
  DropdownMenuItem,
  DropdownMenuLabel,
  Heading,
  InlineCode,
  Link,
  SplitButton,
  Text,
  ToggleGroup,
  ToggleGroupItem
} from '@camunda/design-system';

import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Bot,
  FolderOpen,
  Rocket
} from '@camunda/design-system/icons';

import AiIcon from '../../resources/icons/Ai.svg';

import { Modal } from '../shared/ui';

import Metadata from '../util/Metadata';
import { utmTag } from '../util/utmTag';

import * as css from './EmptyTab.css';

import {
  Tab
} from './primitives';

import Flags, { DISABLE_ZEEBE, DISABLE_PLATFORM, DISPLAY_VERSION } from '../util/Flags';

import { SETTINGS_KEY_PREFER_CAMUNDA_7 } from '../plugins/settings/useBuiltInSettings';

import { BLUEPRINTS } from './blueprints';

import { DEFAULT_ENDPOINT } from '../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerPlugin';

import { C8RUN_DOWNLOAD_URL } from '../plugins/zeebe-plugin/connection-manager-plugin/constants';

const FILE_DESCRIPTIONS = {
  'BPMN diagram': 'Model and automate a process',
  'DMN diagram': 'Define a business decision',
  'Form': 'Design a form for a user task',
  'RPA script': 'Automate a task in a desktop or web app'
};

const C8CTL_DOCS_URL = utmTag('https://docs.camunda.io/docs/apis-tools/c8ctl/getting-started/');

const CAMUNDA_8 = 'Camunda 8';
const CAMUNDA_7 = 'Camunda 7';

/**
 * The featured content of the start page. Swap it to promote something else.
 */
const PROMOTION = {
  icon: AiIcon,
  eyebrow: 'Agentic orchestration',
  title: 'Build your first AI agent',
  description: 'Orchestrate AI agents with BPMN, and keep people in the loop where it matters.',
  action: {
    label: 'Start from blueprint',
    blueprint: 'ai-agent-chat-with-tools'
  },
  secondaryAction: {
    label: 'Read the guide',
    href: utmTag('https://docs.camunda.io/docs/guides/getting-started-agentic-orchestration')
  }
};

const RESOURCES = [
  {
    icon: Rocket,
    title: 'Deploy your first process',
    href: utmTag('https://docs.camunda.io/docs/guides/getting-started-hello-world/')
  },
  {
    icon: Bot,
    title: 'Use Camunda with your coding agent',
    href: utmTag('https://docs.camunda.io/build-with-camunda/')
  },
  {
    icon: BookOpen,
    title: 'Model your first diagram',
    href: utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/model-your-first-diagram/')
  },
  {
    icon: ArrowLeftRight,
    title: 'Migrate from Camunda 7',
    href: utmTag('https://docs.camunda.io/docs/guides/migrating-from-Camunda-Platform/')
  }
];


export default class EmptyTab extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      camunda7Preferred: this.getCamunda7Preferred(),
      localCamunda: null,
      setupOpen: false
    };
  }

  componentDidMount() {
    this._mounted = true;

    this.props.onShown(this.props.tab);

    // the setting may be registered or loaded after the start page is shown
    this._unsubscribe = this.props.settings?.subscribe(SETTINGS_KEY_PREFER_CAMUNDA_7, ({ value }) => {
      this.setState({ camunda7Preferred: !!value });
    });

    // users start Camunda in a terminal and come back
    window.addEventListener('focus', this.checkLocalCamunda);

    this.checkLocalCamunda();
  }

  componentWillUnmount() {
    this._unsubscribe?.();

    window.removeEventListener('focus', this.checkLocalCamunda);

    this._mounted = false;
  }

  triggerAction() { }

  checkLocalCamunda = async () => {
    const { zeebeApi } = this.props;

    if (!zeebeApi || Flags.get(DISABLE_ZEEBE)) {
      return;
    }

    let localCamunda = null;

    try {
      const { success, response } = await zeebeApi.checkConnection(DEFAULT_ENDPOINT);

      if (success) {
        localCamunda = { version: response?.gatewayVersion };
      }
    } catch (error) {
      localCamunda = null;
    }

    if (this._mounted) {
      this.setState({ localCamunda });
    }
  };

  getCamunda7Preferred() {
    const { settings } = this.props;

    if (!settings?.getSchema(SETTINGS_KEY_PREFER_CAMUNDA_7)) {
      return false;
    }

    return !!settings.get(SETTINGS_KEY_PREFER_CAMUNDA_7);
  }

  canChangeCamunda7Preference() {
    const { settings } = this.props;

    const flag = settings?.getSchema(SETTINGS_KEY_PREFER_CAMUNDA_7)?.flag;

    return !!flag && Flags.get(flag) === undefined;
  }

  setCamunda7Preferred = (preferred) => {
    this.props.settings.set({ [ SETTINGS_KEY_PREFER_CAMUNDA_7 ]: preferred });
  };

  openSetup = () => {
    this.setState({ setupOpen: true });
  };

  closeSetup = () => {
    this.setState({ setupOpen: false });

    this.checkLocalCamunda();
  };

  /**
   * @param {string} group
   *
   * @return {Array<Object>}
   */
  getNewFileEntries(group) {
    const providers = this.props.tabsProvider?.getProviders() || {};

    return Object.values(providers)
      .flatMap(tab => tab.getNewFileMenu && tab.getNewFileMenu().map(entry => ({ ...entry, icon: tab.getIcon() })))
      .filter(entry => entry?.group === group);
  }

  renderNewFileEntry = (entry, index) => {
    const description = FILE_DESCRIPTIONS[entry.label];

    return (
      <li key={ index }>
        <button
          type="button"
          className="welcome-file"
          onClick={ () => this.props.onAction(entry.action, entry.options) }
        >
          <span className="welcome-file__icon">
            { entry.icon && <entry.icon aria-hidden="true" /> }
          </span>
          <span className="welcome-file__label">{ entry.label }</span>
          { description && <span className="welcome-file__description">{ description }</span> }
        </button>
      </li>
    );
  };

  renderEngineSwitch(camunda7Selected) {
    if (!this.canChangeCamunda7Preference()) {
      return null;
    }

    return (
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="Camunda version"
        value={ camunda7Selected ? CAMUNDA_7 : CAMUNDA_8 }
        onValueChange={ value => value && this.setCamunda7Preferred(value === CAMUNDA_7) }
      >
        <ToggleGroupItem value={ CAMUNDA_8 }>{ CAMUNDA_8 }</ToggleGroupItem>
        <ToggleGroupItem value={ CAMUNDA_7 }>{ CAMUNDA_7 }</ToggleGroupItem>
      </ToggleGroup>
    );
  }

  renderCreate() {
    const showCamunda8 = !Flags.get(DISABLE_ZEEBE);
    const showCamunda7 = !Flags.get(DISABLE_PLATFORM);

    if (!showCamunda8 && !showCamunda7) {
      return null;
    }

    const canSwitch = showCamunda8 && showCamunda7;

    const group = !showCamunda8 || (canSwitch && this.state.camunda7Preferred) ? CAMUNDA_7 : CAMUNDA_8;

    const id = group === CAMUNDA_7 ? 'welcome-page-platform' : 'welcome-page-cloud';

    return (
      <section className="welcome-create" aria-labelledby="welcome-create-title">
        <div className="welcome-section-header">
          <Heading as="h3" variant="heading-sm" id="welcome-create-title">Create</Heading>
          { canSwitch && this.renderEngineSwitch(group === CAMUNDA_7) }
        </div>
        <ul id={ id } className="welcome-files" data-testid={ id } aria-label={ group }>
          { this.getNewFileEntries(group).map(this.renderNewFileEntry) }
        </ul>
      </section>
    );
  }

  renderC8ctlLink() {
    return <Link inline href={ C8CTL_DOCS_URL } title="c8ctl documentation">c8ctl CLI</Link>;
  }

  renderLocalCamunda() {
    const { localCamunda } = this.state;

    const running = !!localCamunda;

    return (
      <section
        id="welcome-page-local"
        className={ classNames('welcome-local', { 'welcome-local--running': running }) }
        aria-labelledby="welcome-local-title"
      >
        <div className="welcome-local__header">
          <Heading as="h3" variant="heading-sm" id="welcome-local-title">Local environment</Heading>
          <Badge variant={ running ? 'success' : 'neutral' } className="welcome-local__status" data-testid="welcome-local-status">
            <span className="welcome-local__dot" aria-hidden="true" />
            { running ? 'Running' : 'Not running' }
          </Badge>
        </div>
        {
          running ? (
            <>
              <Text as="p" variant="body-subtle">
                { localCamunda.version ? `Camunda ${ localCamunda.version }` : 'Camunda' } is running on your machine.
                Deploy and test, or manage it with the { this.renderC8ctlLink() }.
              </Text>
              <div className="welcome-local__actions">
                <Button asChild variant="secondary" size="sm">
                  <a href={ DEFAULT_ENDPOINT.operateUrl }>Open Operate</a>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <a href={ DEFAULT_ENDPOINT.tasklistUrl }>Open Tasklist</a>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Text as="p" variant="body-subtle">
                Install the c8ctl CLI and start a local Camunda 8 environment to deploy and test.
              </Text>
              <div className="welcome-local__actions">
                <Button size="sm" onClick={ this.openSetup }>Set up with c8ctl</Button>
                <Link inline href={ C8CTL_DOCS_URL } className="welcome-local__docs">What is c8ctl?</Link>
              </div>
            </>
          )
        }
      </section>
    );
  }

  openBlueprint = async ({ name, files, setupNote, setupUrl }) => {
    const { onAction } = this.props;

    await onAction('open-unsaved-files', { files });

    onAction('display-notification', {
      type: 'info',
      title: `Opened ${ name }`,
      content: <>{ setupNote } <a href={ setupUrl }>Set up a provider</a></>,
      duration: 10000
    });
  };

  renderPromotionAction({ label, href, blueprint }) {
    if (blueprint) {
      return (
        <Button size="sm" onClick={ () => this.openBlueprint(BLUEPRINTS[ blueprint ]) }>
          { label }
          <ArrowRight aria-hidden="true" />
        </Button>
      );
    }

    return (
      <Button asChild size="sm">
        <a href={ href }>
          { label }
          <ArrowRight aria-hidden="true" />
        </a>
      </Button>
    );
  }

  renderPromotion({ icon: Icon, eyebrow, title, description, action, secondaryAction }) {
    return (
      <section id="welcome-page-promo" className="welcome-promo" aria-label={ title }>
        <div className="welcome-promo__text">
          <Text as="p" variant="label-sm" className="welcome-promo__eyebrow">{ eyebrow }</Text>
          <Heading as="h3" variant="heading-sm">{ title }</Heading>
          <Text as="p" variant="body-md">{ description }</Text>
          <div className="welcome-promo__actions">
            { this.renderPromotionAction(action) }
            {
              secondaryAction && (
                <Link inline href={ secondaryAction.href }>{ secondaryAction.label }</Link>
              )
            }
          </div>
        </div>
        <Icon className="welcome-promo__icon" aria-hidden="true" />
      </section>
    );
  }

  renderResources() {
    return (
      <nav id="welcome-page-learn-more" className="welcome-resources" aria-labelledby="welcome-resources-title">
        <Heading as="h3" variant="heading-xs" id="welcome-resources-title">Resources</Heading>
        <ul className="welcome-resources__list">
          {
            RESOURCES.map(({ icon: Icon, title, href }) => (
              <li key={ title }>
                <a className="welcome-resource" href={ href }>
                  <Icon aria-hidden="true" />
                  <span>{ title }</span>
                </a>
              </li>
            ))
          }
        </ul>
      </nav>
    );
  }

  renderOpenFile() {
    const { onAction } = this.props;

    const files = getRecentFiles(this.props.recentTabs);

    const label = (
      <>
        <FolderOpen aria-hidden="true" />
        Open file
      </>
    );

    if (!files.length) {
      return (
        <Button variant="secondary" onClick={ () => onAction('open-diagram') }>
          { label }
        </Button>
      );
    }

    return (
      <SplitButton
        variant="secondary"
        label={ label }
        dropdownLabel="Open recent file"
        onPrimaryClick={ () => onAction('open-diagram') }
      >
        <DropdownMenuLabel>Recent files</DropdownMenuLabel>
        {
          files.map(({ name, path }) => (
            <DropdownMenuItem
              key={ path }
              title={ path }
              className={ css.RecentFile }
              onSelect={ () => onAction('open-diagram', { path }) }
            >
              <span className="recent-file__name">{ name }</span>
              <span className="recent-file__path">{ path }</span>
            </DropdownMenuItem>
          ))
        }
      </SplitButton>
    );
  }

  renderHero() {
    const version = Flags.get(DISPLAY_VERSION) || Metadata.version;

    return (
      <header className="welcome-hero">
        <div className="welcome-hero__inner">
          <CamundaLogo className="welcome-hero__logo" />
          <div className="welcome-hero__text">
            <Heading as="h2" variant="heading-lg">Welcome to Camunda Modeler</Heading>
            <Text as="p" variant="body-md">Model, run and test your processes with Camunda.</Text>
            <Text as="p" variant="body-subtle">
              Version { version } · <Link inline href="#" onClick={ () => this.props.emit('versionInfo.open') }>What&apos;s new</Link>
            </Text>
          </div>
          <div className="welcome-hero__actions">
            { this.renderOpenFile() }
          </div>
        </div>
      </header>
    );
  }

  renderSetupDialog() {
    return (
      <Modal onClose={ this.closeSetup }>
        <Modal.Title>Run Camunda locally with c8ctl</Modal.Title>
        <Modal.Body>
          <div id="welcome-page-local-setup" className={ css.LocalSetup }>
            <Text as="p" variant="body-subtle">
              The <InlineCode>c8ctl</InlineCode> CLI starts Camunda 8 Run on your machine,
              and deploys, runs and inspects your processes from the terminal. Requires Node.js 22.18 or newer.
            </Text>
            <ol className="local-setup__steps">
              <li>
                <Text as="p" variant="label-md-strong">Install c8ctl</Text>
                <CodeBlock copyLabel="Copy install command">npm install -g @camunda8/cli</CodeBlock>
              </li>
              <li>
                <Text as="p" variant="label-md-strong">Start Camunda</Text>
                <CodeBlock copyLabel="Copy start command">c8ctl cluster start</CodeBlock>
                <Text as="p" variant="body-subtle">
                  The first start downloads Camunda 8 Run. Once it runs, the start page shows it.
                </Text>
              </li>
            </ol>
            <div className="local-setup__links">
              <Link inline href={ C8CTL_DOCS_URL }>c8ctl documentation</Link>
              <Link inline href={ utmTag('https://docs.camunda.io/docs/self-managed/quickstart/developer-quickstart/') }>
                Other ways to run Camunda locally
              </Link>
              <Link inline href={ C8RUN_DOWNLOAD_URL }>Download Camunda 8 Run without Node.js</Link>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={ this.closeSetup }>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    const showCamunda8 = !Flags.get(DISABLE_ZEEBE);

    const { setupOpen } = this.state;

    return (
      <Tab className={ css.EmptyTab }>
        <div className="welcome">
          { this.renderHero() }
          <div className="welcome__main">
            { this.renderCreate() }
            {
              showCamunda8 && (
                <div className="welcome__aside">
                  { this.renderLocalCamunda() }
                  { this.renderPromotion(PROMOTION) }
                </div>
              )
            }
          </div>
          { this.renderResources() }
        </div>
        { setupOpen && this.renderSetupDialog() }
      </Tab>
    );
  }
}


// helpers //////////

/**
 * Saved files from the recently closed tabs, newest first, without duplicates.
 *
 * @param {Array<Object>} [recentTabs]
 *
 * @return {Array<{ name: string, path: string }>}
 */
function getRecentFiles(recentTabs = []) {
  const paths = new Set();

  return recentTabs
    .slice()
    .reverse()
    .map(tab => tab?.file)
    .filter(file => {
      if (!file?.path || paths.has(file.path)) {
        return false;
      }

      paths.add(file.path);

      return true;
    })
    .map(({ name, path }) => ({ name, path }));
}

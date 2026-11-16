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
  Skeleton,
  SplitButton,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@camunda/design-system';

import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Bot,
  ExternalLink,
  FolderOpen,
  Rocket
} from '@camunda/design-system/icons';

import AiIcon from '../../../resources/icons/Ai.svg';

import { Modal } from '../../shared/ui';

import Metadata from '../../util/Metadata';
import { utmTag } from '../../util/utmTag';

import * as css from './EmptyTab.css';

import {
  Tab
} from '../primitives';

import Flags, { DISABLE_ZEEBE, DISABLE_PLATFORM, DISPLAY_VERSION } from '../../util/Flags';

import { SETTINGS_KEY_START_PAGE_PREFERRED_ENGINE } from '../../plugins/settings/useBuiltInSettings';

import aiAgentChatQuickStart from './ai-agent-chat-quick-start';

import { RecentTabs } from '../RecentTabs';

import { EventsContext } from '../EventsContext';

import { DEFAULT_ENDPOINT } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerPlugin';

import { SETTINGS_KEY_CONNECTIONS } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerSettings';

import { C8RUN_DOWNLOAD_URL } from '../../plugins/zeebe-plugin/connection-manager-plugin/constants';

import ConnectionChecker from '../../plugins/zeebe-plugin/deployment-plugin/ConnectionChecker';

const C8CTL_DOCS_URL = utmTag('https://docs.camunda.io/docs/apis-tools/c8ctl/getting-started/');

const LOCAL_SETUP_DOCS_URL = utmTag('https://docs.camunda.io/docs/self-managed/quickstart/developer-quickstart/');

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
    label: 'Create blueprint project',
    project: aiAgentChatQuickStart
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
    href: utmTag('https://docs.camunda.io/docs/guides/getting-started-hello-world/'),
    camunda8: true
  },
  {
    icon: Bot,
    title: 'Use Camunda with your coding agent',
    href: utmTag('https://docs.camunda.io/build-with-camunda/'),
    camunda8: true
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

  static contextType = EventsContext;

  constructor(props) {
    super(props);

    this.state = {
      preferredEngine: this.getPreferredEngine(),

      // undefined while checking, null if not running
      localCamunda: undefined,
      recentFiles: [],
      setupOpen: false
    };
  }

  componentDidMount() {
    this._mounted = true;

    this.props.onShown(this.props.tab);

    this.loadRecentFiles();

    // the app removes recent tabs of files removed from disk
    this._recentTabsSubscription = this.context.subscribe('app.recentTabsChanged', ({ recentTabs }) => {
      this.setState({ recentFiles: RecentTabs.getRecentFiles(recentTabs) });
    });

    // the setting may be registered or loaded after the start page is shown
    this._unsubscribe = this.props.settings?.subscribe(SETTINGS_KEY_START_PAGE_PREFERRED_ENGINE, ({ value }) => {
      this.setState({ preferredEngine: value });
    });

    // the c8run connection may be registered or loaded after the start page is shown
    this._unsubscribeConnections = this.props.settings?.subscribe(SETTINGS_KEY_CONNECTIONS, this.checkLocalCamunda);

    this.startLocalCamundaChecks();
  }

  componentWillUnmount() {
    this._recentTabsSubscription.cancel();

    this._unsubscribe?.();
    this._unsubscribeConnections?.();

    this.stopLocalCamundaChecks();

    this._mounted = false;
  }

  triggerAction() { }

  /**
   * Load the recent files once; later changes come via <app.recentTabsChanged>.
   */
  async loadRecentFiles() {
    const { config } = this.props;

    if (!config) {
      return;
    }

    const recentFiles = await RecentTabs.loadRecentFiles(config);

    if (this._mounted) {
      this.setState({ recentFiles });
    }
  }

  /**
   * Check periodically whether Camunda runs locally, as users start and stop
   * it in a terminal.
   */
  startLocalCamundaChecks() {
    const { zeebeApi } = this.props;

    if (!zeebeApi || !isCamunda8Enabled()) {
      return;
    }

    this._connectionChecker = new ConnectionChecker(zeebeApi, 'start-page');

    this._connectionChecker.on('connectionCheck', this.handleLocalCamundaCheck);

    this.checkLocalCamunda();
  }

  stopLocalCamundaChecks() {
    if (!this._connectionChecker) {
      return;
    }

    this._connectionChecker.off('connectionCheck', this.handleLocalCamundaCheck);
    this._connectionChecker.stopChecking();
    this._connectionChecker = null;
  }

  checkLocalCamunda = () => {
    this._localEndpoint = this.getLocalEndpoint();

    this._connectionChecker?.updateConfig({ endpoint: this._localEndpoint });
  };

  handleLocalCamundaCheck = ({ success, response }) => {
    const endpoint = this._localEndpoint;

    this.setState({
      localCamunda: success ? {
        version: response?.gatewayVersion,
        operateUrl: endpoint.operateUrl || DEFAULT_ENDPOINT.operateUrl,
        tasklistUrl: endpoint.tasklistUrl || DEFAULT_ENDPOINT.tasklistUrl
      } : null
    });
  };

  /**
   * The c8run connection of the user, or the default one.
   *
   * @return {Object}
   */
  getLocalEndpoint() {
    const { deployment } = this.props;

    return deployment?.getDefaultEndpoint() || DEFAULT_ENDPOINT;
  }

  /**
   * @return {'8'|'7'|undefined}
   */
  getPreferredEngine() {
    const { settings } = this.props;

    if (!settings?.getSchema(SETTINGS_KEY_START_PAGE_PREFERRED_ENGINE)) {
      return;
    }

    return settings.get(SETTINGS_KEY_START_PAGE_PREFERRED_ENGINE);
  }

  setPreferredEngine = (engine) => {
    this.props.settings.set({ [ SETTINGS_KEY_START_PAGE_PREFERRED_ENGINE ]: engine });
  };

  openSetup = () => {
    this.setState({ setupOpen: true });
  };

  closeSetup = () => {
    this.setState({ setupOpen: false });
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
          { entry.description && <span className="welcome-file__description">{ entry.description }</span> }
        </button>
      </li>
    );
  };

  renderEngineSwitch(group) {
    return (
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="Camunda version"
        value={ group }
        onValueChange={ value => value && this.setPreferredEngine(value === CAMUNDA_7 ? '7' : '8') }
      >
        <ToggleGroupItem value={ CAMUNDA_8 }>{ CAMUNDA_8 }</ToggleGroupItem>
        <ToggleGroupItem value={ CAMUNDA_7 }>{ CAMUNDA_7 }</ToggleGroupItem>
      </ToggleGroup>
    );
  }

  renderCreate() {
    const showCamunda8 = isCamunda8Enabled();
    const showCamunda7 = !Flags.get(DISABLE_PLATFORM);

    if (!showCamunda8 && !showCamunda7) {
      return null;
    }

    const canSwitch = showCamunda8 && showCamunda7;

    const group = !showCamunda8 || (canSwitch && this.state.preferredEngine === '7') ? CAMUNDA_7 : CAMUNDA_8;

    const id = group === CAMUNDA_7 ? 'welcome-page-platform' : 'welcome-page-cloud';

    return (
      <section className="welcome-create" aria-labelledby="welcome-create-title">
        <div className="welcome-section-header">
          <Heading as="h3" variant="heading-sm" id="welcome-create-title">Create</Heading>
          { canSwitch && this.renderEngineSwitch(group) }
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

    const checking = localCamunda === undefined;
    const running = !!localCamunda;

    return (
      <section
        id="welcome-page-local"
        className="welcome-local"
        aria-labelledby="welcome-local-title"
        aria-busy={ checking }
      >
        <div className="welcome-local__header">
          <Heading as="h3" variant="heading-sm" id="welcome-local-title">Local environment</Heading>
          <Badge
            role="status"
            variant={ running ? 'success' : 'neutral' }
            className="welcome-local__status"
            data-testid="welcome-local-status"
          >
            { !checking && <span className="welcome-local__dot" aria-hidden="true" /> }
            { checking ? 'Checking' : running ? 'Running' : 'Not running' }
          </Badge>
        </div>
        { checking && this.renderLocalCamundaSkeleton() }
        {
          running && (
            <>
              <Text as="p" variant="body-subtle">
                { localCamunda.version ? `Camunda ${ localCamunda.version }` : 'Camunda' } is running on your machine.
                Deploy and test, or manage it with the { this.renderC8ctlLink() }.
              </Text>
              <div className="welcome-local__actions">
                <Button asChild variant="secondary" size="sm">
                  <a href={ localCamunda.operateUrl }>
                    Open Operate
                    <ExternalLink aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <a href={ localCamunda.tasklistUrl }>
                    Open Tasklist
                    <ExternalLink aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </>
          )
        }
        {
          localCamunda === null && (
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

  renderLocalCamundaSkeleton() {
    return (
      <div className="welcome-local__skeleton" aria-hidden="true">
        <Skeleton className="welcome-local__skeleton-line" />
        <Skeleton className="welcome-local__skeleton-line welcome-local__skeleton-line--short" />
        <Skeleton className="welcome-local__skeleton-action" />
      </div>
    );
  }

  createProject = ({ name, files }) => {
    this.props.emit('create-camunda-project', { title: `Create Project from ${ name }`, files });
  };

  /**
   * A project can be created if every file type has an editor,
   * e.g. not with `disable-form`.
   *
   * @param {{ files: Array<{ name: string }> }} project
   *
   * @return {boolean}
   */
  canCreateProject({ files }) {
    const { tabsProvider } = this.props;

    return files.every(({ name }) => tabsProvider?.hasProvider(getFileExtension(name)));
  }

  renderPromotionAction({ label, href, project }) {
    if (project) {
      if (!this.canCreateProject(project)) {
        return null;
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" onClick={ () => this.createProject(project) }>
              { label }
              <ArrowRight aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Saves the blueprint files to a folder you choose, and the blueprint opens as a project.
          </TooltipContent>
        </Tooltip>
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
      <section className="welcome-promo" id="welcome-page-promotion" aria-label={ title }>
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
    const showCamunda8 = isCamunda8Enabled();

    const resources = RESOURCES.filter(({ camunda8 }) => showCamunda8 || !camunda8);

    return (
      <nav id="welcome-page-learn-more" className="welcome-resources" aria-labelledby="welcome-resources-title">
        <Heading as="h3" variant="heading-xs" id="welcome-resources-title">Learn more</Heading>
        <ul className={ classNames('welcome-resources__list', { 'welcome-resources__list--partial': resources.length < RESOURCES.length }) }>
          {
            resources.map(({ icon: Icon, title, href }) => (
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

    const files = this.state.recentFiles;

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
              Version { version } · <Link inline asChild><button type="button" className="welcome-hero__whats-new" onClick={ () => this.props.emit('versionInfo.open') }>What&apos;s new</button></Link>
            </Text>
          </div>
          <div id="welcome-page-open" className="welcome-hero__actions">
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
              and deploys, runs and inspects your processes from the terminal. Requires Node.js.
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
              <Link inline href={ LOCAL_SETUP_DOCS_URL }>Other ways to run Camunda locally</Link>
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
    const showCamunda8 = isCamunda8Enabled();

    const { setupOpen } = this.state;

    return (
      <Tab className={ css.EmptyTab }>
        <div className="welcome">
          { this.renderHero() }
          <div className={ classNames('welcome__main', { 'welcome__main--single': !showCamunda8 }) }>
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
 * Camunda 8 is turned off with the `disable-zeebe` flag.
 *
 * @return {boolean}
 */
function isCamunda8Enabled() {
  return !Flags.get(DISABLE_ZEEBE);
}

/**
 * @param {string} name
 *
 * @return {string}
 */
function getFileExtension(name) {
  return name.split('.').pop();
}

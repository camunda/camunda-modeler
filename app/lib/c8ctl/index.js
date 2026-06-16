/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Embedded c8ctl runtime.
 *
 * Public backend API for the Camunda Modeler's Quake-style terminal. Holds
 * in-memory session state (active profile/tenant), builds the per-invocation
 * command context (lazy SDK client + tenant resolution), and runs commands via
 * the registry-driven dispatch. Reuses c8ctl's declarative architecture: the
 * registry is the single source of truth, handlers are pure functions, and
 * rendering/error handling are centralised in the framework.
 */

const { Logger, Config, CommandError, createClient, MODELER_PREFIX } = require('./core');
const { tokenize, parseCommandLine, getHandler } = require('./dispatch');
const {
  COMMAND_REGISTRY,
  resolveVerb,
  resolveResource,
  getResourceDef
} = require('./framework/command-registry');
const { COMMAND_DISPATCH } = require('./commands');

const BASE_PROMPT = 'c8ctl >';

class C8ctl {

  /**
   * @param { {
   *   config?: Config,
   *   configOptions?: object,
   *   createCamundaClient?: Function
   * } } [options]
   */
  constructor(options = {}) {
    this._config = options.config || new Config(options.configOptions || {});
    this._createCamundaClient = options.createCamundaClient;
    this._session = {
      activeProfile: undefined,
      activeTenant: undefined
    };
  }

  /**
   * The terminal prompt string. Includes the effective profile name, marked
   * with `*` when it is the implicit default (i.e. nothing was selected with
   * `use profile`). For example: `c8run* | c8ctl >`.
   *
   * @returns {string}
   */
  getPrompt() {
    const active = this._session.activeProfile;
    const isDefault = !active;
    const name = active || this._defaultProfileName();

    if (!name) {
      return BASE_PROMPT;
    }

    const display = name.startsWith(MODELER_PREFIX)
      ? name.slice(MODELER_PREFIX.length)
      : name;

    return `${display}${isDefault ? '*' : ''} | ${BASE_PROMPT}`;
  }

  /**
   * The implicit default profile name, resolved defensively (never throws).
   *
   * @returns {string|undefined}
   */
  _defaultProfileName() {
    try {
      return this._config.getDefaultProfileName();
    } catch {
      return undefined;
    }
  }

  /**
   * Current in-memory session state (active profile/tenant).
   *
   * @returns { { activeProfile?: string, activeTenant?: string } }
   */
  getSession() {
    return { ...this._session };
  }

  /**
   * Every dispatchable command, derived from the registry. Used for help and
   * completion.
   *
   * @returns {Array<{ command: string, description: string }>}
   */
  listCommands() {
    const commands = [];

    for (const [ verb, def ] of Object.entries(COMMAND_REGISTRY)) {
      if (!def.requiresResource) {
        commands.push({ command: verb, description: def.description });
        continue;
      }

      for (const [ resource, resourceDef ] of Object.entries(def.resources)) {
        if (COMMAND_DISPATCH.has(`${verb}:${resource}`)) {
          commands.push({
            command: `${verb} ${resource}`,
            description: resourceDef.description
          });
        }
      }
    }

    return commands;
  }

  /**
   * Prefix-complete a partial command line against the known commands.
   *
   * @param {string} line
   * @returns {string[]} matching command strings
   */
  complete(line) {
    const prefix = (line || '').trimStart();

    return this.listCommands()
      .map((entry) => entry.command)
      .filter((command) => command.startsWith(prefix) && command !== prefix);
  }

  /**
   * Execute a command line and capture its output.
   *
   * @param {string} line
   * @returns {Promise<{ output: string, isError: boolean, prompt: string }>}
   */
  async execute(line) {
    const logger = new Logger();
    const trimmed = (line || '').trim();

    if (!trimmed) {
      return { output: '', isError: false, prompt: this.getPrompt() };
    }

    const tokens = tokenize(trimmed);

    // help: either `help [verb [resource]]` or any command with `--help`/`-h`
    const isHelpVerb = resolveVerb(tokens[0]) === 'help';
    const wantsHelpFlag = tokens.some((token) => token === '--help' || token === '-h');

    if (isHelpVerb || wantsHelpFlag) {
      const target = (isHelpVerb ? tokens.slice(1) : tokens)
        .filter((token) => !token.startsWith('-'));

      this._renderHelpFor(target, logger);

      return { output: logger.toString(), isError: logger.hasErrors(), prompt: this.getPrompt() };
    }

    let parsed;

    try {
      parsed = parseCommandLine(trimmed);
    } catch (error) {
      logger.error(error.message || String(error));

      return { output: logger.toString(), isError: true, prompt: this.getPrompt() };
    }

    const handler = getHandler(parsed.handlerKey);

    if (!handler) {
      logger.error(`Command not implemented: ${parsed.verb} ${parsed.resource || ''}`.trim());

      return { output: logger.toString(), isError: true, prompt: this.getPrompt() };
    }

    const ctx = this._buildContext(parsed, logger);

    try {
      await handler.execute(ctx);
    } catch (error) {
      if (!(error instanceof CommandError)) {

        // unexpected error not already rendered by the framework
        logger.error(error.message || String(error));
      }
    }

    return { output: logger.toString(), isError: logger.hasErrors(), prompt: this.getPrompt() };
  }

  /**
   * Build the per-invocation command context with lazy client/tenant
   * resolution (mirrors c8ctl's lazy config access).
   *
   * @param {object} parsed
   * @param {Logger} logger
   * @returns {object}
   */
  _buildContext(parsed, logger) {
    const config = this._config;
    const session = this._session;
    const createCamundaClient = this._createCamundaClient;

    let client;
    let clientResolved = false;
    let tenantId;
    let tenantResolved = false;

    return {
      logger,
      config,
      session,
      flags: parsed.flags,
      args: parsed.args,
      positionals: parsed.positionals,

      get profile() {
        return session.activeProfile;
      },

      get client() {
        if (!clientResolved) {
          const clusterConfig = config.resolveClusterConfig({
            activeProfile: session.activeProfile
          });

          client = createClient(clusterConfig, { createCamundaClient });
          clientResolved = true;
        }

        return client;
      },

      get tenantId() {
        if (!tenantResolved) {
          tenantId = config.resolveTenantId({
            activeProfile: session.activeProfile,
            activeTenant: session.activeTenant
          });
          tenantResolved = true;
        }

        return tenantId;
      },

      get limit() {
        const raw = parsed.flags && parsed.flags.limit;

        if (raw === undefined) {
          return undefined;
        }

        const parsedLimit = parseInt(raw, 10);

        return Number.isNaN(parsedLimit) ? undefined : parsedLimit;
      }
    };
  }

  /**
   * Render the help listing.
   *
   * @returns {string}
   */
  _renderHelp() {
    const lines = [ 'Available commands:', '' ];

    const commands = this.listCommands();
    const width = Math.max(...commands.map((entry) => entry.command.length));

    for (const entry of commands) {
      lines.push(`  ${entry.command.padEnd(width)}  ${entry.description}`);
    }

    lines.push('');
    lines.push('Run `help <command>` (e.g. `help create process-instance`) or add');
    lines.push('`--help` to a command for its flags and usage.');
    lines.push('Press ` (backtick) to toggle the terminal.');

    return lines.join('\n');
  }

  /**
   * Render help for a help target — the non-flag tokens following `help` (or
   * preceding `--help`). Writes either detailed help (output) or an error to
   * the logger.
   *
   * @param {string[]} target e.g. [ 'create', 'pi' ]
   * @param {Logger} logger
   */
  _renderHelpFor(target, logger) {
    if (target.length === 0) {
      logger.output(this._renderHelp());

      return;
    }

    const verb = resolveVerb(target[0]);

    if (!verb) {
      logger.error(`Unknown command: ${target[0]}`);

      return;
    }

    const def = COMMAND_REGISTRY[verb];

    if (!def.requiresResource) {
      logger.output(this._renderHelp());

      return;
    }

    const rawResource = target[1];

    if (!rawResource) {
      logger.output(this._renderVerbHelp(verb));

      return;
    }

    const resource = resolveResource(verb, rawResource);

    if (!resource) {
      const available = Object.keys(def.resources).join(', ');

      logger.error(`Unknown resource '${rawResource}' for '${verb}'. Available: ${available}`);

      return;
    }

    logger.output(this._renderCommandHelp(verb, resource));
  }

  /**
   * Render the resource listing for a single verb.
   *
   * @param {string} verb canonical verb
   * @returns {string}
   */
  _renderVerbHelp(verb) {
    const def = COMMAND_REGISTRY[verb];
    const resources = Object.entries(def.resources)
      .filter(([ resource ]) => COMMAND_DISPATCH.has(`${verb}:${resource}`));

    const width = Math.max(...resources.map(([ resource ]) => resource.length));

    const lines = [ `${verb} — ${def.description}`, '', 'Resources:' ];

    for (const [ resource, resourceDef ] of resources) {
      lines.push(`  ${resource.padEnd(width)}  ${resourceDef.description}`);
    }

    lines.push('');
    lines.push(`Run \`help ${verb} <resource>\` for flags and usage.`);

    return lines.join('\n');
  }

  /**
   * Render detailed help for a single verb × resource: usage, description,
   * aliases, positional arguments and flags.
   *
   * @param {string} verb canonical verb
   * @param {string} resource canonical resource
   * @returns {string}
   */
  _renderCommandHelp(verb, resource) {
    const def = COMMAND_REGISTRY[verb];
    const resourceDef = getResourceDef(verb, resource);
    const positionals = resourceDef.positionals || [];
    const flags = resourceDef.flags || {};

    const usageParts = [ verb, resource ];

    for (const positional of positionals) {
      usageParts.push(positional.required ? `<${positional.name}>` : `[${positional.name}]`);
    }

    if (Object.keys(flags).length) {
      usageParts.push('[flags]');
    }

    const lines = [
      `Usage: ${usageParts.join(' ')}`,
      '',
      resourceDef.description
    ];

    const verbAliases = def.aliases || [];
    const resourceAliases = resourceDef.aliases || [];

    if (verbAliases.length || resourceAliases.length) {
      const verbForms = [ verb, ...verbAliases ].join('|');
      const resourceForms = [ resource, ...resourceAliases ].join('|');

      lines.push('', `Aliases: ${verbForms} ${resourceForms}`);
    }

    if (positionals.length) {
      const width = Math.max(...positionals.map((positional) => positional.name.length));

      lines.push('', 'Arguments:');

      for (const positional of positionals) {
        const required = positional.required ? ' (required)' : '';
        const description = positional.description || '';

        lines.push(`  ${positional.name.padEnd(width)}  ${description}${required}`);
      }
    }

    const flagEntries = Object.entries(flags);

    if (flagEntries.length) {
      const labels = flagEntries.map(([ name, flagDef ]) => this._flagLabel(name, flagDef));
      const width = Math.max(...labels.map((label) => label.length));

      lines.push('', 'Flags:');

      flagEntries.forEach(([ , flagDef ], index) => {
        const required = flagDef.required ? ' (required)' : '';

        lines.push(`  ${labels[index].padEnd(width)}  ${flagDef.description}${required}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * The display label for a flag in help output, e.g. `--id <value>` or
   * `--xml` (boolean), including a short alias when present.
   *
   * @param {string} name
   * @param {import('./framework/command-registry').FlagDef} flagDef
   * @returns {string}
   */
  _flagLabel(name, flagDef) {
    const short = flagDef.short ? `-${flagDef.short}, ` : '';
    const value = flagDef.type === 'boolean' ? '' : ' <value>';

    return `${short}--${name}${value}`;
  }
}

module.exports = C8ctl;

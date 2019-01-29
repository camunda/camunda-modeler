import { filter } from 'min-dash';

export default class Plugins {
  constructor(app) {
    this.app = app;
  }

  /**
   * Load all plugins by creating either HTML <link> or <script> tag.
   */
  loadAll() {
    const plugins = this.app.plugins.getAll();

    const stylePlugins = filter(plugins, plugins => plugins.style),
          scriptPlugins = filter(plugins, plugins => plugins.script);

    // load style plugins
    stylePlugins.forEach(this._loadStylePlugin);

    // load script plugins
    return Promise.all(scriptPlugins.map(this._loadScriptPlugin));
  }

  /**
   * Binds #getModelerDirectory and #getPluginsDirectory to window to ensure backward compatibility.
   */
  bindGlobalHelpers() {
    window.getModelerDirectory = this._getPluginsProtocol;
    window.getPluginsDirectory = this._getPluginsProtocol;
  }

  /**
   * Get plugins of type.
   *
   * @param {String} type - Plugin type.
   *
   * @returns {Array}
   */
  get(type) {
    return this._getAll()
      .filter(registration => registration.type === type)
      .map(registration => registration.plugin);
  }

  /**
   * Load style plugin by creating HTML <link> tag.
   *
   * @param {Object} stylePlugin - Style plugin.
   * @param {String} stylePlugin.style - Path to stylesheet.
   */
  _loadStylePlugin(stylePlugin) {
    const { style } = stylePlugin;

    const styleTag = document.createElement('link');

    styleTag.href = style;
    styleTag.rel = 'stylesheet';

    document.head.appendChild(styleTag);
  }

  /**
   * Load script plugin by creating HTML <script> tag.
   *
   * @param {Object} scriptPlugin - Script plugin.
   * @param {String} scriptPlugin.script - Path to script.
   */
  _loadScriptPlugin(scriptPlugin) {
    const { script } = scriptPlugin;

    return new Promise(resolve => {
      const scriptTag = document.createElement('script');

      scriptTag.src = script;
      scriptTag.type = 'text/javascript';
      scriptTag.async = false;
      scriptTag.onload = resolve;

      document.head.appendChild(scriptTag);
    });
  }

  /**
   * Get all previously registered plugins. Plugins can register themselves using:
   * https://github.com/camunda/camunda-modeler-plugin-helpers
   *
   * @returns {Array}
   */
  _getAll() {
    return window.plugins || [];
  }

  _getPluginsProtocol() {
    return 'app-plugins://';
  }

}
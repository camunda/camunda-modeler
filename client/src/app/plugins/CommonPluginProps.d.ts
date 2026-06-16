import { config, settings } from '../../globals';
import { App } from '../App';

/**
 * The narrowed set of <App> members exposed to plugins via `_getFromApp`.
 * Keep in sync with `PLUGIN_APP_MEMBERS` in `PluginsRoot.js`.
 */
export type PluginAppMember =
  | '_getNewFileItems'
  | '_getTabIcon'
  | 'getLintingState'
  | 'props'
  | 'selectTab';

export interface CommonPluginProps {
  triggerAction: App['triggerAction'];
  config: typeof config;
  getConfig: App['getConfig'];
  setConfig: App['setConfig'];
  subscribe: any;
  log: (options: {
    message: string;
    category: string;
    action?: string;
    silent?: boolean;
  }) => void;
  displayNotification: App['displayNotification'];
  settings: typeof settings;
  _getFromApp: (prop: PluginAppMember) => any;
  _getGlobal: App['getGlobal'];
}

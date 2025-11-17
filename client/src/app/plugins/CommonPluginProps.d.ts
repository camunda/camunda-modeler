import { config, settings } from '../../globals';
import { App } from '../App';

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
  _getFromApp: (prop) => any;
  _getGlobal: App['getGlobal'];
}

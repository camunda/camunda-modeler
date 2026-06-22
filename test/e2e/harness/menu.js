/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

/**
 * Find the application menu item bound to `accelerator` and, if it is enabled,
 * invoke it as the accelerator would — with `triggeredByAccelerator: true` and
 * the focused window.
 *
 * This drives shortcuts through their real binding: it fails (returns false)
 * if nothing is bound to the accelerator or the command is disabled, so a
 * rebind/unbind or wrong enablement is caught. The OS delivering the keystroke
 * to the accelerator is the one part not exercised (Playwright can't, and that
 * is the OS's responsibility).
 *
 * @param {import('@playwright/test').ElectronApplication} electronApp
 * @param {string} accelerator e.g. 'CommandOrControl+C'
 *
 * @return {Promise<boolean>} whether an enabled item was found and invoked
 */
function triggerAccelerator(electronApp, accelerator) {
  return electronApp.evaluate(({ Menu, BrowserWindow }, accelerator) => {

    // accelerators are stored verbatim ('CommandOrControl + C', 'CmdOrCtrl+...')
    const normalize = (value) => (value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/commandorcontrol|cmdorctrl/g, 'mod');

    const target = normalize(accelerator);

    let match = null;

    const walk = (items) => {
      for (const item of items) {
        if (item.accelerator && normalize(item.accelerator) === target) {
          match = item;

          return;
        }

        if (item.submenu) {
          walk(item.submenu.items);

          if (match) {
            return;
          }
        }
      }
    };

    walk(Menu.getApplicationMenu().items);

    if (!match || match.enabled === false) {
      return false;
    }

    const [ window ] = BrowserWindow.getAllWindows();

    // Electron's MenuItem click is (menuItem, browserWindow, event); handlers
    // read the 3rd arg, so the accelerator event must be passed there.
    try {
      match.click(match, window, { triggeredByAccelerator: true });
    } catch (err) {
      return false;
    }

    return true;
  }, accelerator);
}

/**
 * Click an application menu item by its label. Use for menu actions that have
 * no keyboard accelerator (e.g. the "New File > … (Camunda 8)" entries).
 *
 * @param {import('@playwright/test').ElectronApplication} electronApp
 * @param {string} label the menu item's exact label
 *
 * @return {Promise<void>}
 */
function clickMenuItem(electronApp, label) {
  return electronApp.evaluate(({ Menu, BrowserWindow }, label) => {
    let match = null;

    const walk = (items) => {
      for (const item of items) {
        if (item.label === label) {
          match = item;

          return;
        }

        if (item.submenu) {
          walk(item.submenu.items);

          if (match) {
            return;
          }
        }
      }
    };

    walk(Menu.getApplicationMenu().items);

    if (!match) {
      throw new Error('menu item not found: ' + label);
    }

    const [ window ] = BrowserWindow.getAllWindows();

    // Electron's MenuItem click is (menuItem, browserWindow, event); handlers
    // read the 3rd arg (e.g. `event.triggeredByAccelerator`)
    match.click(match, window, { triggeredByAccelerator: false });
  }, label);
}

/**
 * Find a menu item by label and return its state (or null if not found).
 *
 * @param {import('@playwright/test').ElectronApplication} electronApp
 * @param {string} label
 *
 * @return {Promise<{ label: string, enabled: boolean, accelerator: string|null }|null>}
 */
function findMenuItem(electronApp, label) {
  return electronApp.evaluate(({ Menu }, label) => {
    let found = null;

    const walk = (items) => {
      for (const item of items) {
        if (item.label === label) {
          found = { label: item.label, enabled: item.enabled, accelerator: item.accelerator || null };

          return;
        }

        if (item.submenu) {
          walk(item.submenu.items);

          if (found) {
            return;
          }
        }
      }
    };

    walk(Menu.getApplicationMenu().items);

    return found;
  }, label);
}

/**
 * @param {import('@playwright/test').ElectronApplication} electronApp
 *
 * @return {Promise<string[]>} all application menu item labels
 */
function menuLabels(electronApp) {
  return electronApp.evaluate(({ Menu }) => {
    const labels = [];

    const walk = (items) => {
      for (const item of items) {
        if (item.label) {
          labels.push(item.label);
        }

        if (item.submenu) {
          walk(item.submenu.items);
        }
      }
    };

    walk(Menu.getApplicationMenu().items);

    return labels;
  });
}

module.exports = {
  triggerAccelerator,
  clickMenuItem,
  findMenuItem,
  menuLabels
};

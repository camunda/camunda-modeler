/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useEffect } from 'react';

/**
 * Applies the selected theme to the document root element.
 *
 * @param {import('../../app/Settings').Settings} settings
 */
export default function useTheme(settings) {

  useEffect(() => {

    function applyTheme(theme) {
      const resolvedTheme = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

      document.documentElement.setAttribute('data-theme', resolvedTheme);
    }

    // apply initial theme (setting may not be registered yet)
    let initial = 'light';
    try {
      initial = settings.get('app.theme') ?? 'light';
    } catch (e) {
      // setting not yet registered, use default
    }
    applyTheme(initial);

    // subscribe to changes
    settings.subscribe('app.theme', ({ value }) => {
      applyTheme(value);
    });

    // listen for OS theme changes when set to 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const current = settings.get('app.theme');
      if (current === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);
}

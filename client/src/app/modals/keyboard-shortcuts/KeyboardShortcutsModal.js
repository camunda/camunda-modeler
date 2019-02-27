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

import View from './View';

import getShortcuts from './getShortcuts';

class KeyboardShortcutsModal extends PureComponent {
  getModifierKey() {
    const platform = this.props.getGlobal('backend').getPlatform();

    return platform === 'darwin' ? 'Command' : 'Control';
  }

  render() {
    const modifierKey = this.getModifierKey();

    return <View
      shortcuts={ getShortcuts(modifierKey) }
      onClose={ this.props.onClose }
    />;
  }
}

export default KeyboardShortcutsModal;

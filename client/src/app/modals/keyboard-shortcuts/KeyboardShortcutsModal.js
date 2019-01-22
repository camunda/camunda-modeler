import React, { PureComponent } from 'react';

import View from './View';

import getShortcuts from './getShortcuts';

class KeyboardShortcutsModal extends PureComponent {
  getModifierKey() {
    return this.props.isMac ? 'Command' : 'Control';
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

import React, { PureComponent } from 'react';

import View from './View';

import getShortcuts from './getShortcuts';

class KeyboardShortcutsModal extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {

    const {
      isMac,
      onClose,
    } = this.props;

    let modifierKey = 'Control';

    if (isMac) {
      modifierKey = 'Command';
    }

    return <View
      shortcuts={ getShortcuts(modifierKey) }
      onClose={ onClose }
    />;
  }
}

export default KeyboardShortcutsModal;

import React from 'react';

import { mount } from 'enzyme';

import {
  Cache,
  WithCachedState
} from '../../../cached';

import { XMLEditor } from '../XMLEditor';

import { SlotFillRoot } from 'src/app/slot-fill';

import diagramXML from './diagram.bpmn';


describe('<XMLEditor>', function() {

  describe('#handleChanged', function() {

    it('should notify about changes', function() {

      // given
      const changedSpy = (state) => {

        // then
        expect(state).to.include({
          redo: false,
          undo: false
        });
      };

      const { instance } = renderEditor(diagramXML, {
        onChanged: changedSpy
      });

      // when
      instance.handleChanged();
    });

  });

});


// helpers //////////

function noop() {}

const TestEditor = WithCachedState(XMLEditor);

function renderEditor(xml, options = {}) {
  const {
    id,
    onChanged,
  } = options;

  const slotFillRoot = mount(
    <SlotFillRoot>
      <TestEditor
        id={ id || 'editor' }
        xml={ xml }
        onChanged={ onChanged || noop }
        cache={ options.cache || new Cache() }
      />
    </SlotFillRoot>
  );

  const wrapper = slotFillRoot.find(XMLEditor);

  const instance = wrapper.instance();

  return {
    instance,
    wrapper
  };
}
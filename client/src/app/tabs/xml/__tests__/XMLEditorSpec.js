import React from 'react';

import { mount } from 'enzyme';

import {
  Cache,
  WithCachedState
} from '../../../cached';

import { XMLEditor } from '../XMLEditor';

import { SlotFillRoot } from 'src/app/slot-fill';

const XML = '<xml></xml>';


describe('<XMLEditor>', function() {

  describe('#render', function() {

    it('should render with NO xml', function() {

      const {
        instance
      } = renderEditor();

      expect(instance).to.exist;
    });


    it('should render with xml', function() {

      const {
        instance
      } = renderEditor(XML);

      expect(instance).to.exist;
    });

  });


  describe('state', function() {

    it('should set initial state', function() {

      // given
      const initialState = {
        canExport: false,
        redo: false,
        undo: false
      };

      // when
      const {
        instance
      } = renderEditor(XML);

      expect(instance).to.exist;

      // then
      expect(instance.state).to.eql(initialState);
    });

  });


  it('#getXML', function() {

    // given
    const {
      instance
    } = renderEditor(XML);

    // when
    // then
    expect(instance.getXML()).to.be.equal(XML);
  });


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

      const { instance } = renderEditor(XML, {
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
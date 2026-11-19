/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';

import { getColorEntries } from '../getEditMenu';

import { COLORS } from '../colorPickerColors';


describe('getColorEntries', function() {

  it('should build entries from the bpmn-js-color-picker colors', function() {

    // given
    const setColor = true;

    // when
    const [ entry ] = getColorEntries({ setColor });

    // then
    expect(entry.label).to.equal('Set Color');
    expect(entry.submenu).to.have.length(COLORS.length);

    entry.submenu.forEach((item, index) => {
      expect(item.label).to.equal(COLORS[ index ].label);
      expect(item.enabled).to.equal(setColor);
      expect(item.action).to.equal('setColor');
      expect(item.options).to.deep.equal({
        fill: COLORS[ index ].fill,
        stroke: COLORS[ index ].stroke
      });
      expect(item.icon).to.equal(`resources/icons/${COLORS[ index ].label.toLowerCase()}-circle.png`);
    });
  });


  it('should provide Default as first entry without fill nor stroke', function() {

    // when
    const [ entry ] = getColorEntries({ setColor: true });

    // then
    expect(entry.submenu[ 0 ].label).to.equal('Default');
    expect(entry.submenu[ 0 ].options.fill).to.not.exist;
    expect(entry.submenu[ 0 ].options.stroke).to.not.exist;
  });

});

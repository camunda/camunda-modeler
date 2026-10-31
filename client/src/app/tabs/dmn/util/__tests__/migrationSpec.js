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

import {
  findDmnVersionToMigrate,
  getMigrationDialog
} from '../migration';


describe('tabs/dmn/util - migration', function() {

  describe('findDmnVersionToMigrate', function() {

    function definitions(namespace) {
      return `<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="${ namespace }" id="Definitions_1" />`;
    }

    [
      [ '1.1', 'http://www.omg.org/spec/DMN/20151101/dmn.xsd' ],
      [ '1.2', 'http://www.omg.org/spec/DMN/20180521/MODEL/' ],
      [ '1.4', 'https://www.omg.org/spec/DMN/20211108/MODEL/' ],
      [ '1.5', 'https://www.omg.org/spec/DMN/20230324/MODEL/' ],
      [ '1.6', 'https://www.omg.org/spec/DMN/20240513/MODEL/' ],
      [ '1.7', 'https://www.omg.org/spec/DMN/' ]
    ].forEach(([ dmnVersion, namespace ]) => {

      it(`should find DMN ${ dmnVersion }`, function() {

        // when
        const result = findDmnVersionToMigrate(definitions(namespace));

        // then
        expect(result).to.eql(dmnVersion);
      });

    });


    it('should find DMN 1.7 with prefixed namespace', function() {

      // given
      const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<dmn:definitions xmlns:dmn="https://www.omg.org/spec/DMN/" dmnVersion="1.7" id="Definitions_1" />';

      // when
      const result = findDmnVersionToMigrate(xml);

      // then
      expect(result).to.eql('1.7');
    });


    it('should NOT find DMN 1.3', function() {

      // when
      const result = findDmnVersionToMigrate(definitions('https://www.omg.org/spec/DMN/20191111/MODEL/'));

      // then
      expect(result).to.be.null;
    });

  });


  describe('getMigrationDialog', function() {

    it('should allow to skip migration dialog for older DMN version', function() {

      // when
      const dialog = getMigrationDialog('1.2');

      // then
      expect(dialog.title).to.eql('Deprecated DMN 1.2 Diagram Detected');
      expect(dialog.checkboxLabel).to.exist;
    });


    it('should NOT allow to skip migration dialog for newer DMN version', function() {

      // when
      const dialog = getMigrationDialog('1.7');

      // then
      expect(dialog.title).to.eql('DMN 1.7 Diagram Detected');
      expect(dialog.detail).to.include('will be removed');
      expect(dialog.checkboxLabel).not.to.exist;
    });

  });

});

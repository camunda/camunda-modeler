/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import TabStorage from '../TabStorage';

describe('TabStorage', function() {

  let tabStorage;

  beforeEach(function() {
    tabStorage = new TabStorage();
  });


  describe('constructor', function() {

    it('should create an empty storage', function() {

      // given
      const storage = new TabStorage();

      // when
      const result = storage.getAll({ id: 'tab1' });

      // then
      expect(result).to.eql({});
    });

  });


  describe('#set', function() {

    it('should store a value for a tab', function() {

      // given
      const tab = { id: 'tab1' };

      // when
      tabStorage.set(tab, 'key1', 'value1');

      // then
      expect(tabStorage.get(tab, 'key1')).to.equal('value1');
    });


    it('should store multiple values for the same tab', function() {

      // given
      const tab = { id: 'tab1' };

      // when
      tabStorage.set(tab, 'key1', 'value1');
      tabStorage.set(tab, 'key2', 'value2');

      // then
      expect(tabStorage.get(tab, 'key1')).to.equal('value1');
      expect(tabStorage.get(tab, 'key2')).to.equal('value2');
    });


    it('should store values for different tabs independently', function() {

      // given
      const tab1 = { id: 'tab1' };
      const tab2 = { id: 'tab2' };

      // when
      tabStorage.set(tab1, 'key1', 'value1');
      tabStorage.set(tab2, 'key1', 'value2');

      // then
      expect(tabStorage.get(tab1, 'key1')).to.equal('value1');
      expect(tabStorage.get(tab2, 'key1')).to.equal('value2');
    });


    it('should overwrite existing value', function() {

      // given
      const tab = { id: 'tab1' };
      tabStorage.set(tab, 'key1', 'value1');

      // when
      tabStorage.set(tab, 'key1', 'value2');

      // then
      expect(tabStorage.get(tab, 'key1')).to.equal('value2');
    });


    it('should store object values', function() {

      // given
      const tab = { id: 'tab1' };
      const obj = { foo: 'bar', nested: { a: 1 } };

      // when
      tabStorage.set(tab, 'key1', obj);

      // then
      expect(tabStorage.get(tab, 'key1')).to.equal(obj);
    });


    it('should store null values', function() {

      // given
      const tab = { id: 'tab1' };

      // when
      tabStorage.set(tab, 'key1', null);

      // then
      expect(tabStorage.get(tab, 'key1')).to.be.null;
    });


    it('should store undefined values (returns default)', function() {

      // given
      const tab = { id: 'tab1' };

      // when
      tabStorage.set(tab, 'key1', undefined);

      // then
      // Note: storing undefined is treated as non-existent, so returns default
      expect(tabStorage.get(tab, 'key1')).to.be.null;
      expect(tabStorage.get(tab, 'key1', 'default')).to.equal('default');
    });


    it('should store boolean values', function() {

      // given
      const tab = { id: 'tab1' };

      // when
      tabStorage.set(tab, 'key1', false);
      tabStorage.set(tab, 'key2', true);

      // then
      expect(tabStorage.get(tab, 'key1')).to.be.false;
      expect(tabStorage.get(tab, 'key2')).to.be.true;
    });


    it('should store numeric values', function() {

      // given
      const tab = { id: 'tab1' };

      // when
      tabStorage.set(tab, 'key1', 0);
      tabStorage.set(tab, 'key2', 42);

      // then
      expect(tabStorage.get(tab, 'key1')).to.equal(0);
      expect(tabStorage.get(tab, 'key2')).to.equal(42);
    });

  });


  describe('#get', function() {

    it('should return stored value', function() {

      // given
      const tab = { id: 'tab1' };
      tabStorage.set(tab, 'key1', 'value1');

      // when
      const result = tabStorage.get(tab, 'key1');

      // then
      expect(result).to.equal('value1');
    });


    it('should return null for non-existent key', function() {

      // given
      const tab = { id: 'tab1' };

      // when
      const result = tabStorage.get(tab, 'key1');

      // then
      expect(result).to.be.null;
    });


    it('should return default value for non-existent key', function() {

      // given
      const tab = { id: 'tab1' };

      // when
      const result = tabStorage.get(tab, 'key1', 'default');

      // then
      expect(result).to.equal('default');
    });


    it('should return null for non-existent tab', function() {

      // given
      const tab = { id: 'nonexistent' };

      // when
      const result = tabStorage.get(tab, 'key1');

      // then
      expect(result).to.be.null;
    });


    it('should return default value for non-existent tab', function() {

      // given
      const tab = { id: 'nonexistent' };

      // when
      const result = tabStorage.get(tab, 'key1', 'default');

      // then
      expect(result).to.equal('default');
    });


    it('should treat undefined as non-existent', function() {

      // given
      const tab = { id: 'tab1' };
      tabStorage.set(tab, 'key1', undefined);

      // when
      const result = tabStorage.get(tab, 'key1', 'default');

      // then
      // By design: storing undefined is same as not having the key
      expect(result).to.equal('default');
    });


    it('should return falsy values correctly', function() {

      // given
      const tab = { id: 'tab1' };
      tabStorage.set(tab, 'key1', 0);
      tabStorage.set(tab, 'key2', false);
      tabStorage.set(tab, 'key3', '');

      // when & then
      expect(tabStorage.get(tab, 'key1')).to.equal(0);
      expect(tabStorage.get(tab, 'key2')).to.be.false;
      expect(tabStorage.get(tab, 'key3')).to.equal('');
    });

  });


  describe('#getAll', function() {

    it('should return all data for a tab', function() {

      // given
      const tab = { id: 'tab1' };
      tabStorage.set(tab, 'key1', 'value1');
      tabStorage.set(tab, 'key2', 'value2');

      // when
      const result = tabStorage.getAll(tab);

      // then
      expect(result).to.eql({
        key1: 'value1',
        key2: 'value2'
      });
    });


    it('should return empty object for non-existent tab', function() {

      // given
      const tab = { id: 'nonexistent' };

      // when
      const result = tabStorage.getAll(tab);

      // then
      expect(result).to.eql({});
    });


    it('should return empty object for tab with no data', function() {

      // given
      const tab = { id: 'tab1' };

      // when
      const result = tabStorage.getAll(tab);

      // then
      expect(result).to.eql({});
    });


    it('should not affect other tabs', function() {

      // given
      const tab1 = { id: 'tab1' };
      const tab2 = { id: 'tab2' };
      tabStorage.set(tab1, 'key1', 'value1');
      tabStorage.set(tab2, 'key2', 'value2');

      // when
      const result1 = tabStorage.getAll(tab1);
      const result2 = tabStorage.getAll(tab2);

      // then
      expect(result1).to.eql({ key1: 'value1' });
      expect(result2).to.eql({ key2: 'value2' });
    });

  });


  describe('#removeTab', function() {

    it('should remove all data for a tab', function() {

      // given
      const tab = { id: 'tab1' };
      tabStorage.set(tab, 'key1', 'value1');
      tabStorage.set(tab, 'key2', 'value2');

      // when
      tabStorage.removeTab(tab.id);

      // then
      expect(tabStorage.get(tab, 'key1')).to.be.null;
      expect(tabStorage.get(tab, 'key2')).to.be.null;
      expect(tabStorage.getAll(tab)).to.eql({});
    });


    it('should not affect other tabs', function() {

      // given
      const tab1 = { id: 'tab1' };
      const tab2 = { id: 'tab2' };
      tabStorage.set(tab1, 'key1', 'value1');
      tabStorage.set(tab2, 'key2', 'value2');

      // when
      tabStorage.removeTab(tab1.id);

      // then
      expect(tabStorage.get(tab1, 'key1')).to.be.null;
      expect(tabStorage.get(tab2, 'key2')).to.equal('value2');
    });


    it('should handle removing non-existent tab', function() {

      // when
      tabStorage.removeTab('nonexistent');

      // then
      // should not throw error
    });


    it('should allow re-adding data after removal', function() {

      // given
      const tab = { id: 'tab1' };
      tabStorage.set(tab, 'key1', 'value1');
      tabStorage.removeTab(tab.id);

      // when
      tabStorage.set(tab, 'key1', 'value2');

      // then
      expect(tabStorage.get(tab, 'key1')).to.equal('value2');
    });

  });


  describe('#clear', function() {

    it('should remove all data from all tabs', function() {

      // given
      const tab1 = { id: 'tab1' };
      const tab2 = { id: 'tab2' };
      tabStorage.set(tab1, 'key1', 'value1');
      tabStorage.set(tab2, 'key2', 'value2');

      // when
      tabStorage.clear();

      // then
      expect(tabStorage.get(tab1, 'key1')).to.be.null;
      expect(tabStorage.get(tab2, 'key2')).to.be.null;
      expect(tabStorage.getAll(tab1)).to.eql({});
      expect(tabStorage.getAll(tab2)).to.eql({});
    });


    it('should handle clearing empty storage', function() {

      // when
      tabStorage.clear();

      // then
      // should not throw error
    });


    it('should allow adding data after clear', function() {

      // given
      const tab = { id: 'tab1' };
      tabStorage.set(tab, 'key1', 'value1');
      tabStorage.clear();

      // when
      tabStorage.set(tab, 'key1', 'value2');

      // then
      expect(tabStorage.get(tab, 'key1')).to.equal('value2');
    });

  });


  describe('integration scenarios', function() {

    it('should handle complex workflow', function() {

      // given
      const tab1 = { id: 'tab1' };
      const tab2 = { id: 'tab2' };
      const tab3 = { id: 'tab3' };

      // when - add data to multiple tabs
      tabStorage.set(tab1, 'connection', { url: 'http://localhost:8080' });
      tabStorage.set(tab1, 'auth', { token: 'abc123' });
      tabStorage.set(tab2, 'connection', { url: 'http://localhost:9090' });
      tabStorage.set(tab3, 'connection', { url: 'http://localhost:7070' });

      // then - verify all data is stored correctly
      expect(tabStorage.get(tab1, 'connection')).to.eql({ url: 'http://localhost:8080' });
      expect(tabStorage.get(tab1, 'auth')).to.eql({ token: 'abc123' });
      expect(tabStorage.get(tab2, 'connection')).to.eql({ url: 'http://localhost:9090' });

      // when - remove one tab
      tabStorage.removeTab(tab2.id);

      // then - other tabs still have data
      expect(tabStorage.get(tab1, 'connection')).to.eql({ url: 'http://localhost:8080' });
      expect(tabStorage.get(tab3, 'connection')).to.eql({ url: 'http://localhost:7070' });
      expect(tabStorage.get(tab2, 'connection')).to.be.null;

      // when - update existing data
      tabStorage.set(tab1, 'connection', { url: 'http://localhost:8888' });

      // then - data is updated
      expect(tabStorage.get(tab1, 'connection')).to.eql({ url: 'http://localhost:8888' });

      // when - clear all
      tabStorage.clear();

      // then - all data is gone
      expect(tabStorage.get(tab1, 'connection')).to.be.null;
      expect(tabStorage.get(tab3, 'connection')).to.be.null;
    });


    it('should handle same key across multiple tabs', function() {

      // given
      const tabs = [
        { id: 'tab1' },
        { id: 'tab2' },
        { id: 'tab3' }
      ];

      // when - set same key with different values
      tabs.forEach((tab, index) => {
        tabStorage.set(tab, 'index', index);
      });

      // then - each tab has its own value
      tabs.forEach((tab, index) => {
        expect(tabStorage.get(tab, 'index')).to.equal(index);
      });
    });


    it('should handle rapid tab creation and deletion', function() {

      // given
      const tabs = Array.from({ length: 10 }, (_, i) => ({ id: `tab${i}` }));

      // when - add data to all tabs
      tabs.forEach((tab, i) => {
        tabStorage.set(tab, 'data', `value${i}`);
      });

      // then - all data is stored
      tabs.forEach((tab, i) => {
        expect(tabStorage.get(tab, 'data')).to.equal(`value${i}`);
      });

      // when - remove every other tab
      tabs.forEach((tab, i) => {
        if (i % 2 === 0) {
          tabStorage.removeTab(tab.id);
        }
      });

      // then - only odd tabs have data
      tabs.forEach((tab, i) => {
        if (i % 2 === 0) {
          expect(tabStorage.get(tab, 'data')).to.be.null;
        } else {
          expect(tabStorage.get(tab, 'data')).to.equal(`value${i}`);
        }
      });
    });

  });

});

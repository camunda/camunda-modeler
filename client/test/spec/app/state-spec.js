'use strict';

var Dialog = require('test/helper/mock/dialog'),
    Events = require('test/helper/mock/events'),
    FileSystem = require('test/helper/mock/file-system'),
    Workspace = require('test/helper/mock/workspace'),
    Logger = require('base/logger');

var State = require('app/state');

var App = require('app');


describe('State', function() {

  var app;

  beforeEach(function() {

    app = new App({
      dialog: new Dialog(),
      events: new Events(),
      fileSystem: new FileSystem(),
      workspace: new Workspace(),
      logger: new Logger()
    });
  });


  describe('event emitter', function() {

    it('should broadcast accumulated state', function(done) {

      // given
      new State(app);

      app.emit('state:update', {
        a: 'a',
        b: 'B',
        tabs: 4
      });

      app.on('state:changed', function(newState) {

        // then
        expect(newState).to.eql({
          a: 'a',
          b: 'B',
          tabs: 4,
          foo: 'BAR'
        });

        done();
      });

      // when
      app.emit('state:update', {
        foo: 'BAR'
      });
    });


    it('should broadcast latest updated state', function(done){

      // given
      new State(app);

      app.emit('state:update', {
        a: 'a',
        b: 'b'
      });

      app.on('state:changed', function(newState) {

        // then
        expect(newState).to.eql({
          a: 'a',
          b: 'X',
          c: 'c'
        });

        done();
      });

      // when
      app.emit('state:update', {
        b: 'X',
        c: 'c'
      });
    });

  });

});
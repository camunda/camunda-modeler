'use strict';

/* global sinon */

var inherits = require('inherits');

var BaseDialog = require('external/base-dialog');

var EventEmitter = require('events');


function TestDialog(events)  {
  BaseDialog.call(this, events);

  var openDialogs = [];

  this._doOpen = function(args, callback) {

    var dialogInvocation = {
      id: args[0],
      args: args,
      callback: function() {
        var args = Array.prototype.slice.call(arguments);

        var idx = openDialogs.indexOf(dialogInvocation);

        openDialogs.splice(idx, 1);

        callback.apply(null, args);
      }
    };

    openDialogs.push(dialogInvocation);
  };

  /**
   * Close last dialog with provided arguments.
   */
  this.closeLast = function() {
    var args = Array.prototype.slice.call(arguments);
    var lastOpen = openDialogs[openDialogs.length - 1];

    if (lastOpen) {
      lastOpen.callback.apply(null, args);
    }
  };

  this.getOpen = function() {
    return openDialogs;
  };
}

inherits(TestDialog, BaseDialog);


describe('external/dialog', function() {

  var events, dialog;

  beforeEach(function() {
    events = new EventEmitter();
    dialog = new TestDialog(events);
  });


  it('should notify show overlay', function() {

    // given
    var callback = sinon.spy(function() { });

    var toggleOverlaySpy = sinon.spy(function(show) {
      expect(show).to.be.true;
    });

    events.once('dialog-overlay:toggle', toggleOverlaySpy);

    // when
    dialog.saveAs({ foo: 'BAR' }, callback);

    // then
    expect(toggleOverlaySpy).to.have.been.called;
    expect(callback).not.to.have.been.called;
  });


  it('should notify hide overlay', function() {

    // given
    var callback = sinon.spy(function(err, result) {
      expect(err).not.to.exist;
      expect(result).to.eql('BAR');
    });

    var toggleOverlaySpy = sinon.spy(function(show) {
      expect(show).to.be.false;
    });


    dialog.saveAs({ foo: 'BAR' }, callback);

    events.once('dialog-overlay:toggle', toggleOverlaySpy);

    // when
    dialog.closeLast(null, 'BAR');

    // then
    expect(toggleOverlaySpy).to.have.been.called;
    expect(callback).to.have.been.called;
  });


  it('should not double notify show overlay', function() {

    // given
    var callback1 = sinon.spy(function() { });
    var callback2 = sinon.spy(function() { });

    var toggleOverlaySpy = sinon.spy(function() { });

    events.on('dialog-overlay:toggle', toggleOverlaySpy);

    // when
    dialog.saveAs({ foo: 'BAR' }, callback1);
    dialog.saveAs({ foo: 'BAR' }, callback2);

    // then
    expect(toggleOverlaySpy).to.have.been.calledOnce;

    toggleOverlaySpy.reset();

    // but when
    dialog.closeLast();

    // then
    expect(toggleOverlaySpy).not.to.have.been.called;
    expect(callback2).to.have.been.called;

    // but when...
    dialog.closeLast();

    // then
    expect(toggleOverlaySpy).to.have.been.calledWith(false);
    expect(callback1).to.have.been.called;
  });

});
import draggerFactory from '../dragger';

/* global sinon */


describe('dragger', function() {

  afterEach(function() {
    document.dispatchEvent(new DragEvent('dragend'));
  });

  it('should call provided function on drag event', function() {

    // given
    const callbackSpy = sinon.spy();
    const dragger = draggerFactory(callbackSpy);

    // when
    dragger(new DragEvent('dragstart'));

    document.dispatchEvent(new DragEvent('drag', { clientX: 1, clientY: 1 }));

    // then
    expect(callbackSpy).to.be.calledOnce;
  });


  it('should not call provided function for last drag event with (0, 0) values', function() {

    // given
    const callbackSpy = sinon.spy();
    const dragger = draggerFactory(callbackSpy);

    // when
    dragger(new DragEvent('dragstart'));

    document.dispatchEvent(new DragEvent('drag', { clientX: 0, clientY: 0 }));

    // then
    expect(callbackSpy).to.not.be.called;
  });

});

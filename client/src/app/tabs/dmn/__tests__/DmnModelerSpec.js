import DmnModeler from '../DmnModeler';


describe('DmnModeler', function() {

  it('should bootstrap', function() {

    // when
    const modeler = new DmnModeler();

    // when
    expect(modeler).to.exist;
  });


  it('#getStackIdx', function() {

    // when
    const modeler = new DmnModeler();

    // when
    expect(modeler.getStackIdx()).to.equal(-1);
  });

});
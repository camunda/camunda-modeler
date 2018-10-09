import TabsProvider from '../TabsProvider';


describe('TabsProvider', function() {

  it('should default to noop provider', function() {

    // given
    const tabsProvider = new TabsProvider();

    // when
    const provider = tabsProvider.getProvider('unknown');

    // then
    expect(provider.getComponent()).to.be.null;
    expect(provider.getInitialContents()).to.be.null;
  });


  it('should provide BPMN, CMMN, DMN and empty tab', function() {

    // given
    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.getProvider('cmmn')).to.exist;
    expect(tabsProvider.getProvider('bpmn')).to.exist;
    expect(tabsProvider.getProvider('dmn')).to.exist;

    expect(tabsProvider.getProvider('empty')).to.exist;
  });


  it('should provide initial tab contents', function() {

    // given
    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.getInitialFileContents('bpmn')).to.exist;
    expect(tabsProvider.getInitialFileContents('cmmn')).to.exist;
    expect(tabsProvider.getInitialFileContents('dmn', { table: true })).to.exist;
    expect(tabsProvider.getInitialFileContents('dmn')).to.exist;
  });


  it('should create tabs', function() {

    // given
    const tabsProvider = new TabsProvider();

    // then
    expect(tabsProvider.createTab('bpmn')).to.exist;
    expect(tabsProvider.createTab('cmmn')).to.exist;
    expect(tabsProvider.createTab('dmn', { table: true })).to.exist;
    expect(tabsProvider.createTab('dmn')).to.exist;
  });


  // TODO(nikku): test fails on Windows
  (process.env.WINDOWS ? it.skip : it)('should provide tab component',
    async function() {

      // given
      const tabsProvider = new TabsProvider();

      // then
      expect(await tabsProvider.getTabComponent('bpmn')).to.exist;
      expect(await tabsProvider.getTabComponent('cmmn')).to.exist;
      expect(await tabsProvider.getTabComponent('dmn', { table: true })).to.exist;
      expect(await tabsProvider.getTabComponent('dmn')).to.exist;

      expect(await tabsProvider.getTabComponent('empty')).to.exist;
    }
  );


  it('should create tab for file', function() {
    // given
    const tabsProvider = new TabsProvider();

    const file = {
      name: 'foo.bpmn',
      path: '/a/foo.bpmn'
    };

    // when
    const tab = tabsProvider.createTabForFile(file);

    // then
    expect(tab.name).to.eql(file.name);
    expect(tab.title).to.eql(file.path);
  });

});
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


  describe('create tab for file', function() {

    it('should create for known file (by extension)', function() {

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
      expect(tab.type).to.eql('bpmn');
    });


    it('should create for known file (by lower case extension)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.BPMN',
        path: '/a/foo.BPMN'
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('bpmn');
    });


    it('should create for known file (by contents)', function() {

      // given
      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.xml',
        path: '/a/foo.xml',
        contents: require('./TabsProviderSpec.dmn.xml')
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab.name).to.eql(file.name);
      expect(tab.title).to.eql(file.path);
      expect(tab.type).to.eql('dmn');
    });


    it('should not create for unknown file', function() {

      // given
      const tabsProvider = new TabsProvider();

      const file = {
        name: 'foo.unknown',
        contents: ''
      };

      // when
      const tab = tabsProvider.createTabForFile(file);

      // then
      expect(tab).not.to.exist;
    });

  });


  it('#getProviders', function() {

    // given
    const tabsProvider = new TabsProvider();

    // when
    const providers = tabsProvider.getProviders();

    // then
    expect(providers['bpmn']).to.exist;
    expect(providers['cmmn']).to.exist;
    expect(providers['dmn']).to.exist;
    expect(providers['empty']).to.exist;
  });


  it('#getProviderNames', function() {

    // given
    const tabsProvider = new TabsProvider();

    // when
    const providerNames = tabsProvider.getProviderNames();

    // then
    expect(providerNames).to.eql([ 'BPMN', 'CMMN', 'DMN' ]);
  });


  describe('#hasProvider', function() {

    let tabsProvider;

    beforeEach(function() {
      tabsProvider = new TabsProvider();
    });


    it('should have provider', function() {

      // when
      const hasProvider = tabsProvider.hasProvider('bpmn');

      // then
      expect(hasProvider).to.be.true;
    });

    it('should NOT have provider', function() {

      // when
      const hasProvider = tabsProvider.hasProvider('unknown');

      // then
      expect(hasProvider).to.be.false;
    });

  });

});
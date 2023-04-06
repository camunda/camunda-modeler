const ZeebeAPI = require("../lib/zeebe-api");
const {readFile} = require("../lib/file-system");
const ZeebeNode = require("zeebe-node");
const Flags = require("../lib/flags")

const customClusterEndpoint = "gke.upgradingdave.com:443";
const customOauthUrl = "https://gke.upgradingdave.com/auth/realms/camunda-platform/protocol/openid-connect/token";
const customAudience = "oauth2";
const customClientId = "zeebe";
const customClientSecret = "xxx";

/**
 * Test using the zeebe-node library directly
 * with Oauth Handshake
 */
async function smOauthTest() {

  const zbc = new ZeebeNode.ZBClient(customClusterEndpoint, {
    oAuth: {
      url: customOauthUrl,
      audience: customAudience,
      clientId: customClientId,
      clientSecret: customClientSecret,
      //customRootCert: fs.readFileSync('./my_CA.pem'),
      cacheOnDisk: false
    }, useTLS: true
  });

  //console.log(zbc);

  try {
    let result = await zbc.topology();
    console.log("success!");
    //console.log(result);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Test using the zeebe-node library directly
 * no Oauth Handshake
 */
async function smTls() {

  const zbc = new ZeebeNode.ZBClient(customClusterEndpoint, {
    useTLS: true
  });

  //console.log(zbc);

  try {
    let result = await zbc.topology();
    console.log("success!");
    //console.log(result);
  } catch (err) {
    console.log(err);
  }
}

async function smModelerOauthTest() {

  const parameters = {
    endpoint: {
      type: 'oauth',
      url: customClusterEndpoint,
      oauthURL: customOauthUrl,
      audience: customAudience,
      clientId: customClientId,
      clientSecret: customClientSecret
    }
  };

  const flags = new Flags({});
  const zeebeAPI = new ZeebeAPI({ readFile }, ZeebeNode, flags);
  const result = await zeebeAPI.checkConnection(parameters);
  console.log(result);
}

async function smModelerTls() {

  const parameters = {
    endpoint: {
      type: 'selfHosted',
      url: 'https://' + customClusterEndpoint,
    }
  };

  const flags = new Flags({});
  const zeebeAPI = new ZeebeAPI({ readFile }, ZeebeNode, flags);
  const result = await zeebeAPI.checkConnection(parameters);
  console.log(result);
}

smTls();
smModelerTls();


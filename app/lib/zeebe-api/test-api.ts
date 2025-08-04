// npx tsx /Users/simon.steinruecken/git/camunda/camunda-modeler/app/lib/zeebe-api/test-api.ts

import { Camunda8 } from "@camunda8/sdk";
import pino from "pino";
// const c8 = new Camunda8();
// const restClient = c8.getCamundaRestClient(); // New REST API
// const zeebeGrpc = c8.getZeebeGrpcApiClient();
// const zeebeRest = c8.getZeebeRestClient(); // Deprecated
// const operate = c8.getOperateApiClient();
// const optimize = c8.getOptimizeApiClient();
// const tasklist = c8.getTasklistApiClient();
// const modeler = c8.getModelerApiClient();
// const admin = c8.getAdminApiClient();

const logger = pino({ level: "trace" });

async function main() {
  // change method
  const c8 = new Camunda8({
    logger,
    ZEEBE_REST_ADDRESS: "http://localhost:8080",
    // CAMUNDA_OAUTH_DISABLED: true,
    CAMUNDA_AUTH_STRATEGY: "COOKIE",
    CAMUNDA_COOKIE_AUTH_URL: "http://localhost:8080/api/login",
    CAMUNDA_COOKIE_AUTH_USERNAME: "demo",
    CAMUNDA_COOKIE_AUTH_PASSWORD: "demo",
    // CAMUNDA_SECURE_CONNECTION: false,
    // // CAMUNDA_TENANT_ID: "<default>",
  });
  const restClient = c8.getCamundaRestClient(); // New REST API
  const restTopology = await restClient.getTopology();
  console.log("REST Topology:", restTopology);
}

console.log("Start");
main()
  .then(() => console.log("Done"))
  .catch((err) => console.error("Error:", err.response?.data || err.message));

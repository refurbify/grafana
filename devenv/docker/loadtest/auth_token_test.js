import { sleep, check, group } from 'k6';
import { createClient, createBasicAuthClient, createBearerAuthClient } from './modules/client.js';
import { createTestOrgIfNotExists, createTestdataDatasourceIfNotExists } from './modules/util.js';

/**
 * Dafydd - 6 november 2020
 * Notes on the state of working with API Keys against Hosted Grafana instances
 * 
 * Key difference to the instances these tests are normally run against: Admin
 * users do not seem to have the permissions to create new "orgs" in a HG instance.
 * There fore the createTestOrgIfNotExists call fails, even if validating with an
 * Admin API key.
 * 
 * Current state: 
 * 
 * - This will run against a HG instance if you give a valid API key as the token
 *   env.
 * - The createTestOrg function will not error correctly if it gets a 401/403. If 
 *    this works correctly, it blocks the rest of the work.
 * - createTestDatasource has been amended so it errors on e.g. a 403.
 * - client setup moved into the default function - you cannot amend things in
 *  the init state from the setup function.
 * 
 * Actions:
 * - Make the bearer auth option available in all tests, OR make a separate test
 *  for it .
 * - Amend the createOrg step so it errors correctly and/or doesnt run when
 *  running against a HG instance
 */

export let options = {
  noCookiesReset: true,
};

let endpoint = __ENV.URL || 'http://localhost:3000';
let token = __ENV.TOKEN;

export const setup = () => {

  let authClient
  if (token) {
    authClient = createBearerAuthClient(endpoint, token);
  } else {
    authClient = createBasicAuthClient(endpoint, 'admin', 'admin');
  }

  const orgId = createTestOrgIfNotExists(authClient);
  const datasourceId = createTestdataDatasourceIfNotExists(authClient);

  return {
    orgId,
    datasourceId,
  };

};


export default data => {
  group('user auth token test', () => {

    // Need to create this here - changes made in setup are not persisted to default.
    let client;
    if (token) {
      client = createBearerAuthClient(endpoint, token);
    } else {
      client = createClient(endpoint);
    }
    client.withOrgId(data.orgId);

    if (__ITER === 0 && !token) {
      group('user authenticates through ui with username and password', () => {
        let res = client.ui.login('admin', 'admin');

        check(res, {
          'response status is 200': r => r.status === 200,
          "response has cookie 'grafana_session' with 32 characters": r =>
            r.cookies.grafana_session[0].value.length === 32,
        });
      });
    }

    if (__ITER !== 0) {
      group('batch tsdb requests', () => {
        const batchCount = 20;
        const requests = [];
        const payload = {
          from: '1547765247624',
          to: '1547768847624',
          queries: [
            {
              refId: 'A',
              scenarioId: 'random_walk',
              intervalMs: 10000,
              maxDataPoints: 433,
              datasourceId: data.datasourceId,
            },
          ],
        };

        requests.push({ method: 'GET', url: '/api/annotations?dashboardId=2074&from=1548078832772&to=1548082432772' });

        for (let n = 0; n < batchCount; n++) {
          requests.push({ method: 'POST', url: '/api/tsdb/query', body: payload });
        }

        let responses = client.batch(requests);
        for (let n = 0; n < batchCount; n++) {
          check(responses[n], {
            'response status is 200': r => r.status === 200,
          });
        }
      });
    }
  });

  sleep(5);
};

export const teardown = data => {};

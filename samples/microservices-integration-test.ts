import { getTestConfig } from '../packages/infrastructure/spec/testUtils';
import { Auth } from 'aws-amplify';
import { access } from 'fs';
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const execSync = require('child_process').execSync;
const logger = console;

export const microservicesTests = async (): Promise<void> => {
  logger.info('Setting up test environment');

  const config = await getTestConfig();

  Auth.configure({
    Auth: {
      region: config.region,
      userPoolId: config.userPoolId,
      userPoolWebClientId: config.cognitoClientId,
      oauth: {
        scope: ['email', 'openid', 'profile'],
        redirectSignIn: '',
        redirectSignOut: '',
        responseType: 'code',
        mandatorySignIn: true,
      },
    },
  });

  const response = await Auth.signIn(config.username, config.password);
  const accessToken = response?.signInUserSession?.idToken?.jwtToken;
  if (!accessToken) {
    logger.info(`Response from amplify: ${JSON.stringify(response)}`);
    fail('Test user was not authenticated.');
  }

  logger.info(accessToken);
  logger.info(config.apiUrl);

  const env = Object.create(process.env);
  env.API_TOKEN = accessToken;
  try {
    const { stdout, stderr } = await exec(
      `bash ../../python-microservices/bcat/tests.sh ${config.apiUrl} ${accessToken} ../../python-microservices/bcat`,
      {
        env: env,
      }
    );
    logger.info('stdout:', stdout);
  } catch (err) {
    logger.info(err);
  }
};

microservicesTests();

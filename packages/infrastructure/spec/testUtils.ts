/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
import { getConfig, getLocalGitBranch, TestEnvConfig } from '../../../config';
require('dotenv').config();

export const getTestConfig = async (): Promise<TestEnvConfig> => {
  if (process.env.GIT_BRANCH) {
    console.log('Running in CICD, use existing environment vars');
    const cfg = {
      username: process.env.TEST_USER!,
      password: process.env.TEST_PASSWORD!,

      region: process.env.AWS_REGION!,
      userPoolId: process.env.USER_POOL_ID!,
      apiUrl: process.env.API_URL!,
      cognitoClientId: process.env.COGNITO_CLIENT_ID!,
    };
    console.log('Test Config', cfg);
    return cfg;
  }

  const branch = await getLocalGitBranch();
  const config = getConfig(branch);

  if (!config.testing) {
    throw new Error('Testing endpoint is undefined');
  }

  console.log('config', config.testing);
  // * @todo: Should clean this up and move it to .dotenv file or something
  return {
    ...config.testing,
    username: process.env.INTEGRATION_TESTING_USERNAME!,
    password: process.env.INTEGRATION_TESTING_PASSWORD!,
  };
};

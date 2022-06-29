import { getConfig, getLocalGitBranch, TestEnvConfig } from '../../../config';

/**
 * This is a hacky way to get config for integration testing.
 * @todo: Should clean this up and move it to .dotenv file or something
 */
export const getTestConfig = async (): Promise<TestEnvConfig> => {
  if (process.env.GIT_BRANCH) {
    console.log('Running in CICD, use existing environment vars');
    return {
      // @todo: read this from environment or param store
      username: 'nahum@mergingfutures.com',
      password: '7Z9PzBq7Ul8l0@@Li#oxWj37',

      region: process.env.AWS_REGION!,
      userPoolId: process.env.USER_POOL_ID!,
      apiEndpoint: process.env.APOLLO_API_URL!,
      cognitoClientId: process.env.COGNITO_CLIENT_ID!
    };
  }

  const branch = await getLocalGitBranch();
  const config = getConfig(branch);

  if (!config.testing) {
    throw new Error('Testing endpoint is undefined');
  }

  return config.testing;
};

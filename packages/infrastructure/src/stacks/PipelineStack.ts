import { SecretValue, Stack, StackProps, Stage } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, StageDeployment } from 'aws-cdk-lib/pipelines';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import { ApiStack, ApiStackProps } from '.';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface PipelineStackProps extends StackProps {
  /**
   * GitHub source configuration
   */
  source: {
    /**
     * Case-sensitive GitHub repo name
     *  i.e. mergingfutures/cori-data-api
     */
    repo: string;
    /**
     * Which branch to listen on
     * When changes are committed, the pipeline will trigger
     */
    branch: string;

    /**
     * Personal access token for authentication
     *  i.e. cdk.SecretValue.secretsManager('mergingfutures-pat')
     */
    authentication: SecretValue;

    /**
     * How to trigger the pipeline.
     *  Must have admin access on repo to use WEBHOOK.
     *  Only read access is required for POLL
     */
    trigger?: GitHubTrigger;
  };

  /**
   * Use this to re-use an existing S3 bucket.
   */
  artifactBucketName?: string;

  /**
   * Configures the api to be deployed by the pipeline
   */
  ApiConfig: ApiStackProps;

  /**
   * Credentials for Integration Testing
   */
  integrationConfig: {
    userName: string;
    password: string;
  };
}

/**
 * Creates a pipeline which listens on a specific branch and deploys to the environment (stage) associated with the branch.
 *  This pipeline only has 1 stage because each stage is tied to a branch.
 *  Create multiple pipelines for other environments.
 */
export class PipelineStack extends Stack {
  pipeline: CodePipeline;
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // Destructure incoming stack parameters
    const { source, artifactBucketName, integrationConfig } = props;

    console.log('Integration Configuration ', integrationConfig);

    /**
     * Send a request to Parameter store to access Cognito User name and password
     * for integration testing.
     *
     * The integration tests are located in `spec/integration-test.spec.ts`
     */

    const userName = integrationConfig.userName
      ? ssm.StringParameter.valueFromLookup(this, integrationConfig.userName)
      : 'NOT_SET';
    const password = integrationConfig.password
      ? ssm.StringParameter.valueFromLookup(this, integrationConfig.password)
      : 'NOT_SET';

    const artifactBucket = artifactBucketName
      ? Bucket.fromBucketName(this, 'ArtifactBucket', artifactBucketName)
      : undefined;

    // This allows a more fine-grained control of the underlying pipeline
    const _pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: `${id}-pipeline`,
      restartExecutionOnUpdate: true,
      crossAccountKeys: false,
      artifactBucket,
    });

    this.pipeline = new CodePipeline(this, `CodePipeline`, {
      selfMutation: true,
      codePipeline: _pipeline,
      dockerEnabledForSynth: true,
      codeBuildDefaults: {
        rolePolicy: [
          new PolicyStatement({
            actions: ['sts:AssumeRole'],
            resources: ['*'],
          }),
        ],
        buildEnvironment: {
          environmentVariables: {
            GIT_BRANCH: {
              value: source.branch,
            },
            // @todo: Move to param store
            TEST_USER: {
              value: userName,
            },
            // @todo: Move to param store
            TEST_PASSWORD: {
              value: password,
            },
          },
        },
      },
      synth: new ShellStep('Synth', { // <= "Build" stage in CodePipeline
        input: CodePipelineSource.gitHub(source.repo, source.branch, {
          authentication: source.authentication,
          trigger: source.trigger,
        }),
        commands: [
          'npm --version',
          'npm install -g npm@9.6.6',
          'npm install',
          'npm run build',
          'cd packages/infrastructure && npm run synth:pipeline',
        ],
        primaryOutputDirectory: 'packages/infrastructure/cdk.out',
      }),
    });

    console.log("Add API Stage with microservices: ", props.ApiConfig.microservicesConfig);

    this.addApiStage(props.ApiConfig);
  }

  /**
   * Creates a Pipeline Stage, which will deploy the data-api
   */
  addApiStage(config: ApiStackProps): StageDeployment {
    const stage = new Stage(this, 'Deploy');
    const stack = new ApiStack(stage, 'App', {
      ...config,
      stackName: `${config.client}-data-api-${config.stage}`,
    });

    const pipelineStage = this.pipeline.addStage(stage);

    pipelineStage.addPost(
      new ShellStep('IntegrationTest', {
        // Add environment specific outputs here
        envFromCfnOutputs: {
          API_URL: stack.cloudFrontUrl,
          USER_POOL_ID: stack.userPoolIdOutput,
          COGNITO_CLIENT_ID: stack.postmanClientIdOutput,
          COGNITO_DOMAIN: stack.cognitoDomainOutput,
        },
        // Execute your integration test
        commands: [
          'echo $API_URL',
          'echo $USER_POOL_ID',
          'echo $COGNITO_CLIENT_ID',
          'echo $COGNITO_DOMAIN',
          'ls',
          'npm --version',
          'npm install -g npm@9.6.6',
          'npm install',
          // Execute Jest Integration Tests
          'npm run test:integration --w packages/infrastructure'
        ],
      })
    );

    return pipelineStage;
  }
}

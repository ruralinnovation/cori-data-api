import { SecretValue, Stack, StackProps, Stage } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, StageDeployment } from 'aws-cdk-lib/pipelines';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import { ApiStack, ApiStackProps } from '.';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Bucket } from 'aws-cdk-lib/aws-s3';

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

    const { source, artifactBucketName } = props;

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
              value: 'int-test@yopmail.com',
            },
            // @todo: Move to param store
            TEST_PASSWORD: {
              value: 'P@ssw0rd1',
            },
          },
        },
      },
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(source.repo, source.branch, {
          authentication: source.authentication,
          trigger: source.trigger,
        }),
        commands: [
          'npm install -g npm@latest',
          'npm --version',
          'npm i',
          'npm run build',
          'npm run synth:pipeline -w infrastructure',
        ],
        primaryOutputDirectory: 'packages/infrastructure/cdk.out',
      }),
    });

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
          'npm install -g npm@latest',
          'npm i',
          // Execute Jest Integration Tests
          'npm run test:integration --w packages/infrastructure',
          /**
           * The below will run Python Robot Framework Integration tests
           * We will need to hook up an authentication mechanism to pass in a token to these tests
           * For now only run them locally
           */
          // Execute Python Integration Tests
          // 'pip install robotframework',
          // 'pip install robotframework-requests',
          // 'export PATH="$HOME/.local/bin:$PATH"',
          // '. ./python-microservices/bcat/tests.sh',
        ],
      })
    );

    return pipelineStage;
  }
}

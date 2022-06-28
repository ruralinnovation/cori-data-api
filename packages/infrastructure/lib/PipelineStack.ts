import { SecretValue, Stack, StackProps, Stage } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
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

    // This allows a more fine-grained control of the underlying pipeline
    const _pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: `${id}-pipeline`,
      restartExecutionOnUpdate: true,
      artifactBucket: artifactBucketName ? Bucket.fromBucketName(this, 'ArtifactBucket', artifactBucketName) : undefined
    });

    this.pipeline = new CodePipeline(this, `CodePipeline`, {
      selfMutation: true,
      codePipeline: _pipeline,
      dockerEnabledForSynth: true,
      codeBuildDefaults: {
        rolePolicy: [
          new PolicyStatement({
            actions: ['sts:AssumeRole'],
            resources: ['*']
          })
        ],
        buildEnvironment: {
          environmentVariables: {
            GIT_BRANCH: {
              value: source.branch
            }
          }
        }
      },
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(source.repo, source.branch, {
          authentication: source.authentication,
          trigger: source.trigger
        }),
        commands: [
          'npm install -g npm@latest',
          'npm --version',
          'npm i',
          'npm ci',
          'npm run build',
          'npm run synth:pipeline -w infrastructure'
        ],
        primaryOutputDirectory: 'packages/infrastructure/cdk.out'
      })
    });

    this.addApiStage(props.ApiConfig);
  }

  /**
   * Creates a Pipeline Stage, which will deploy the data-api
   */
  addApiStage(config: ApiStackProps): Stage {
    const { client, stage } = config;

    const pipelineStage = new Stage(this, stage);

    new ApiStack(pipelineStage, `${client}-data-api-${stage}`, {
      ...config
    });

    this.pipeline.addStage(pipelineStage);

    return pipelineStage;
  }
}

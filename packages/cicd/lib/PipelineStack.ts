import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';

export interface CICDPipelineProps extends StackProps {
  client: string;
  stage: string;
  project: string;
  source: {
    repo: string;
    branch: string;
    authentication: SecretValue;
    trigger?: GitHubTrigger;
  }
  env: {
    account: string;
    region: string;
  };
}

export class CICDPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: CICDPipelineProps) {
    super(scope, id, props);

    const accountNumber = Stack.of(this).account;
    const region = Stack.of(this).region;

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: `${props.client}-${props.project}-cicdpipeline-${props.stage}`,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(props.source.repo, props.source.branch),
        commands: ['cd ./packages/cicd', 'npm i', 'npm ci', 'npm run build:cicd', 'npm run synth:cicd'],
        primaryOutputDirectory: './packages/cicd/cdk.out',
      }),
    });
  }
}

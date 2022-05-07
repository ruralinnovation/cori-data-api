import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { CICDAppStage } from './AppStage';

export interface CICDPipelineProps extends StackProps {
  client: string;
  stage: string;
  project: string;
  repo: string;
  branch: string;
}

export class CICDPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: CICDPipelineProps) {
    super(scope, id, props);

    const accountNumber = Stack.of(this).account;
    const region = Stack.of(this).region;

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: `${props.client}-${props.project}-cicdpipeline-${props.stage}`,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(props.repo, props.branch),
        commands: ['npm i'],
      }),
    });
  }
}

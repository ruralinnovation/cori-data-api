import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { CICDAppStage } from './AppStage';
import { CICDPipelineProps } from './PipelineStack';

export interface CICDProps extends StackProps {
  env?: {
    account: string;
    region: string;
  };
  environments: CICDPipelineProps[];
}

export class CICDStack extends Stack {
  constructor(scope: Construct, id: string, props: CICDProps) {
    super(scope, id, props);

    const accountNumber = Stack.of(this).account;
    const region = Stack.of(this).region;

    props.environments.forEach(env => {
      const pipeline = new CodePipeline(this, `Pipeline_${env.stage}`, {
        pipelineName: `${env.client}-${env.project}-cicdpipeline-${env.stage}`,
        synth: new ShellStep('Synth', {
          input: CodePipelineSource.gitHub(env.repo, env.branch),
          commands: ['npm ci', 'npm run build:all', 'npm run synth'],
        }),
      });
    });
  }
}

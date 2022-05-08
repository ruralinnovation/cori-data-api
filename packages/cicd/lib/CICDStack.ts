import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { AppStage } from './AppStage';
import { CICDPipelineProps } from './PipelineStack';

export interface CICDProps extends StackProps {
  environments: CICDPipelineProps[];
}

export class CICDStack extends Stack {
  constructor(scope: Construct, id: string, props: CICDProps) {
    super(scope, id, props);

    props.environments.forEach((env, i) => {
      console.log('deploying ', env);
      const pipeline = new CodePipeline(this, `Pipeline_${env.stage}`, {
        pipelineName: `${env.client}-${env.project}-cicdpipeline-${env.stage}`,
        dockerEnabledForSynth: true,
        synth: new ShellStep('Synth', {
          input: CodePipelineSource.gitHub(env.repo, env.branch),
          commands: [
            'npm install -g npm@latest',
            'npm --version',
            'npm install',
            'npm ci',
            'npm run build:all',
            'npm run synth:cicd',
          ],
          primaryOutputDirectory: 'packages/cicd/cdk.out',
        }),
      });

      // pipeline.addStage(
      //   new AppStage(this, `DeployApiResources${i + 1}`, {
      //     env: { account: env.env.account, region: env.env.region },
      //     stage: env.stage,
      //   })
      // );
    });
  }
}

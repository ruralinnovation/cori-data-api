import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { AppStage } from './AppStage';
import { CICDPipelineProps } from './PipelineStack';

export interface CICDProps extends StackProps {
  environmentConfigs: {
    [name: string]: CICDPipelineProps;
  };
}

export class CICDStack extends Stack {
  constructor(scope: Construct, id: string, props: CICDProps) {
    super(scope, id, props);

    const devPipeline = new CodePipeline(this, `DevPipeline`, {
      pipelineName: `cori-data-api-pipeline-dev`,
      dockerEnabledForSynth: true,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(props.environmentConfigs.dev.repo, props.environmentConfigs.dev.branch),
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

    devPipeline.addStage(
      new AppStage(this, `DeployDevResources`, {
        env: props.environmentConfigs.dev.env,
        stage: props.environmentConfigs.dev.stage,
      })
    );

    const prodPipeline = new CodePipeline(this, `QaPipeline`, {
      pipelineName: `cori-data-api-pipeline-qa`,
      dockerEnabledForSynth: true,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(props.environmentConfigs.qa.repo, props.environmentConfigs.qa.branch),
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

    prodPipeline.addStage(
      new AppStage(this, `DeployQaResources`, {
        env: props.environmentConfigs.qa.env,
        stage: props.environmentConfigs.qa.stage,
      })
    );
  }
}

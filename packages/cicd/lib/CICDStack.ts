import { Stack, StackProps } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
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
      selfMutation: false,
      pipelineName: `cori-data-api-pipeline-dev`,
      dockerEnabledForSynth: true,
      codeBuildDefaults: {
        rolePolicy: [
          new PolicyStatement({
            actions: ['sts:AssumeRole'],
            resources: ['*'],
          }),
        ],
      },
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(props.environmentConfigs.dev.repo, props.environmentConfigs.dev.branch),
        commands: [
          'npm install -g npm@latest',
          'npm --version',
          'npm i',
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

    // const qaPipeline = new CodePipeline(this, `QaPipeline`, {
    //   pipelineName: `cori-data-api-pipeline-qa`,
    //   dockerEnabledForSynth: true,
    //   codeBuildDefaults: {
    //     rolePolicy: [
    //       new PolicyStatement({
    //         actions: ['sts:AssumeRole'],
    //         resources: ['*'],
    //       }),
    //     ],
    //   },
    //   synth: new ShellStep('Synth', {
    //     input: CodePipelineSource.gitHub(props.environmentConfigs.qa.repo, props.environmentConfigs.qa.branch),
    //     commands: ['npm install -g npm@latest', 'npm --version', 'npm ci', 'npm run build:all', 'npm run synth:cicd'],
    //     primaryOutputDirectory: 'packages/cicd/cdk.out',
    //   }),
    // });

    // qaPipeline.addStage(
    //   new AppStage(this, `DeployQaResources`, {
    //     env: props.environmentConfigs.qa.env,
    //     stage: props.environmentConfigs.qa.stage,
    //   })
    // );

    // const prodPipeline = new CodePipeline(this, `ProdPipeline`, {
    //   selfMutation: false,
    //   pipelineName: `cori-data-api-pipeline-prod`,
    //   dockerEnabledForSynth: true,
    //   codeBuildDefaults: {
    //     rolePolicy: [
    //       new PolicyStatement({
    //         actions: ['sts:AssumeRole'],
    //         resources: ['*'],
    //       }),
    //     ],
    //   },
    //   synth: new ShellStep('Synth', {
    //     input: CodePipelineSource.gitHub(props.environmentConfigs.prod.repo, props.environmentConfigs.prod.branch),
    //     commands: [
    //       'npm install -g npm@latest',
    //       'npm --version',
    //       'npm i',
    //       'npm ci',
    //       'npm run build:all',
    //       'npm run synth:cicd',
    //     ],
    //     primaryOutputDirectory: 'packages/cicd/cdk.out',
    //   }),
    // });
    // prodPipeline.addStage(
    //   new AppStage(this, `DeployProdResources`, {
    //     env: props.environmentConfigs.prod.env,
    //     stage: props.environmentConfigs.prod.stage,
    //   }),
    //   {
    //     pre: [new ManualApprovalStep('PromoteToProd')],
    //   }
    // );
  }
}

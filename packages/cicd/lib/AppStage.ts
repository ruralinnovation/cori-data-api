import { Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getConfig } from '../../infrastructure/config/config';
import { ApiStack } from '../../infrastructure/lib';

export interface CICDAppStageProps extends StageProps {
  stage: string;
}
export class AppStage extends Stage {
  constructor(scope: Construct, id: string, props: CICDAppStageProps) {
    super(scope, id, props);
    const config = getConfig(this.node.tryGetContext(props.stage));
    const apiStack = new ApiStack(this, `${config.client}-data-api-${config.stage}`, {
      ...config,
    });
  }
}

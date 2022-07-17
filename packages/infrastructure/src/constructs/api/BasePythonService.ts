import { Duration } from 'aws-cdk-lib';
import { IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ApiGw } from './ApiGw';

interface BasePythonServiceProps {
  prefix: string;
  stage: string;

  vpc: IVpc;
  securityGroups?: SecurityGroup[];

  api: ApiGw;

  dependencyLayer: LayerVersion;

  environment: {
    LOGGING_LEVEL: string;
    STAGE: string;
    SECRET: string;
    DB_USER: string;
    REGION: string;
    DB_HOST: string;
    DB_NAME: string;
  };
}

export class BasePythonService extends Construct {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceDefaults: any;
  constructor(scope: Construct, id: string, props: BasePythonServiceProps) {
    super(scope, id);

    const { stage, vpc, securityGroups, environment, api, dependencyLayer } = props;

    this.serviceDefaults = {
      api,
      timeout: Duration.seconds(360),
      vpc,
      allowPublicSubnet: true,
      apiOriginPath: stage,
      securityGroups,
      runtime: Runtime.PYTHON_3_8,
      layers: [dependencyLayer] as LayerVersion[],
      memorySize: 256,
      environment,
    };
  }
}

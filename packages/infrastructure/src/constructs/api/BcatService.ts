import { IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { join } from 'path';
import { PythonLambda } from '../lambda';
import { microservicesDirectory } from '../../util';
import { ApiGw } from './ApiGw';
import { BasePythonService } from './BasePythonService';

interface BcatServiceProps {
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
export class BcatService extends BasePythonService {
  constructor(scope: Construct, id: string, props: BcatServiceProps) {
    super(scope, id, props);
    const { prefix, api } = props;
    /**
     * BCAT Microservice
     */
    const bcatService = new PythonLambda(this, 'BCATService', {
      ...this.serviceDefaults,
      functionName: prefix + '-bcat-service',
      entry: join(microservicesDirectory, 'bcat'),
    });

    api.addLambda({
      method: 'GET',
      path: '/bcat/{proxy+}',
      lambda: bcatService.function,
    });
  }
}

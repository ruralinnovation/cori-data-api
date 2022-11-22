import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { LayerVersion, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { join } from 'path';
import { PythonLambda } from '../lambda';
import { microservicesDirectory } from '../../util';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { ApiGw } from './ApiGw';
import { ServiceConfig } from '../../../stacks/ApiStack';

interface PythonDataServerProps {
  prefix: string;
  stage: string;

  userPool: IUserPool;

  vpc: IVpc;
  securityGroups?: SecurityGroup[];

  environment: {
    LOGGING_LEVEL: string;
    STAGE: string;
    SECRET: string;
    DB_USER: string;
    REGION: string;
    DB_HOST: string;
    DB_NAME: string;
  };
  microservicesConfig: ServiceConfig[];
}
export class PythonDataServer extends Construct {
  readonly apiGw: ApiGw;
  constructor(scope: Construct, id: string, props: PythonDataServerProps) {
    super(scope, id);

    const { prefix, stage, userPool, vpc, securityGroups, environment, microservicesConfig } = props;

    /**
     * Python Data RESTApi
     */
    this.apiGw = new ApiGw(this, 'PythonApi', {
      prefix: prefix + '-python-data-api',
      stage,
      // cloudWatchRole: this.iam.roles === undefined,
      cloudWatchRole: true,
      userPool: userPool,
      binaryMediaTypes: ['application~1x-protobuf', '*~1*'],
    });

    /**
     * Python Dependency Lambda Layer
     * Speeds up Lambda initialization
     */
    // const pythonDependencyLayer = new LayerVersion(this, 'DependencyLayer', {
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   code: Code.fromAsset(join(microservicesDirectory, '/dependency-layer/dependency-layer.zip')),
    //   compatibleRuntimes: [Runtime.PYTHON_3_8],
    // });

    const defaults = {
      api: this.apiGw,
      // cfUrl: this.hosting.url,
      timeout: Duration.seconds(360),
      vpc,
      allowPublicSubnet: true,
      apiOriginPath: stage,
      securityGroups,
      runtime: Runtime.PYTHON_3_8,
      // layers: [pythonDependencyLayer] as LayerVersion[],
      memorySize: 256,
      environment,
    };

    // if (stage === 'local') {
    //   /**
    //    * Local Lambda Instantiation for Local API
    //    */
    //   const localApiWrapper = new PythonLambda(this, 'LocalApi', {
    //     ...defaults,
    //     functionName: prefix + '-local-api',
    //     entry: join(microservicesDirectory, 'local'),
    //   });
    //
    //   // this.apiGw.addLambda({
    //   //   method: 'GET',
    //   //   path: '/local/{proxy+}',
    //   //   lambda: localApiWrapper.function,
    //   // });
    //
    //   microservicesConfig.forEach(config => {
    //     const service = new PythonLambda(this, config.logicalName, {
    //       ...defaults,
    //       functionName: prefix + `-${config.directoryName}-microservice-1`,
    //       entry: join(microservicesDirectory, config.directoryName),
    //     });
    //
    //     this.apiGw.addLambda({
    //       method: 'GET',
    //       path: `/local${config.corePath}/{proxy+}`,
    //       lambda: service.function,
    //     });
    //   });
    //
    // } else {
    microservicesConfig.forEach(config => {
      const service = new PythonLambda(this, config.logicalName, {
        ...defaults,
        functionName: prefix + `-${config.directoryName}-microservice-1`,
        entry: join(microservicesDirectory, config.directoryName),
      });

      this.apiGw.addLambda({
        method: 'GET',
        path: `${config.corePath}/{proxy+}`,
        lambda: service.function,
      });
    });
  }
  // }
}

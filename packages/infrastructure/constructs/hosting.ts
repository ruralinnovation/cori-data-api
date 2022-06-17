import { Construct } from 'constructs';
import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
  SourceConfiguration,
  CloudFrontAllowedMethods,
  CloudFrontAllowedCachedMethods,
  OriginProtocolPolicy,
  CfnDistribution,
} from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Api } from './Api';

export interface CustomApiOriginConfig {
  restApiId: string;
  originPath: string;
  behaviorPathPattern: string;
  default: boolean;
}
export interface HostingProps {
  prefix: string;
  apiOriginConfigs: CustomApiOriginConfig[];
}

export class Hosting extends Construct {
  distribution: CloudFrontWebDistribution;
  bucket: Bucket;
  url: string;
  originConfigs: SourceConfiguration[] = [];

  public addCustomApiOrigin(config: CustomApiOriginConfig) {
    const domain = `${config.restApiId}.execute-api.${Stack.of(this).region}.amazonaws.com`;
    this.originConfigs.push({
      customOriginSource: {
        domainName: domain,
        originPath: config.originPath,
        originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      },
      behaviors: [
        {
          isDefaultBehavior: config.default,
          pathPattern: config.behaviorPathPattern,
          forwardedValues: {
            queryString: true,
            headers: ['Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Origin', 'Authorization'],
          },
          minTtl: Duration.seconds(0),
          defaultTtl: Duration.seconds(0),
          maxTtl: Duration.seconds(0),
          allowedMethods: CloudFrontAllowedMethods.ALL,
          cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
        },
      ],
    });
  }
  constructor(scope: Construct, id: string, props: HostingProps) {
    super(scope, id);
    this.bucket = new Bucket(this, 'LogBucket', {
      bucketName: props.prefix + '-cloudfront-log-bucket',
    });

    props.apiOriginConfigs.forEach(config => {
      this.addCustomApiOrigin(config);
    });

    this.distribution = new CloudFrontWebDistribution(this, 'Distribution', {
      comment: props.prefix,
      originConfigs: this.originConfigs,
      defaultRootObject: 'index.html',
      errorConfigurations: [
        {
          errorCode: 403,
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
        {
          errorCode: 404,
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
      ],
      loggingConfig: {
        bucket: this.bucket,
        prefix: 'cloudfront-logs/',
      },
    });
    // Override logical name for backwards compatibility
    //(this.distribution.node.defaultChild as CfnDistribution).overrideLogicalId('ClientCloudFrontDistro');

    this.url = `https://${this.distribution.distributionDomainName}`;
  }
}

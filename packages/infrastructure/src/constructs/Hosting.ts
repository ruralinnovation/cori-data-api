import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import {
  CloudFrontWebDistribution,
  SourceConfiguration,
  CloudFrontAllowedMethods,
  CloudFrontAllowedCachedMethods,
  OriginProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Retainable } from '../models';

export interface ApiOriginConfig {
  domain: string;
  originPath: string;
  behaviorPathPattern: string;
  default: boolean;
}
export interface HostingProps extends Retainable {
  prefix: string;
  apiOriginConfigs: ApiOriginConfig[];
}

export class Hosting extends Construct {
  readonly distribution: CloudFrontWebDistribution;
  readonly loggingBucket: Bucket;
  readonly url: string;

  private buildApiOrigin(config: ApiOriginConfig): SourceConfiguration {
    return {
      customOriginSource: {
        domainName: config.domain,
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
    };
  }

  constructor(scope: Construct, id: string, props: HostingProps) {
    super(scope, id);

    this.loggingBucket = new Bucket(this, 'LogBucket', {
      bucketName: props.prefix + '-cloudfront-log-bucket',
      removalPolicy: props.retain ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    this.distribution = new CloudFrontWebDistribution(this, 'Distribution', {
      comment: props.prefix,
      originConfigs: props.apiOriginConfigs.map(x => this.buildApiOrigin(x)),
      defaultRootObject: 'index.html',
      loggingConfig: {
        bucket: this.loggingBucket,
        prefix: 'cloudfront-logs/',
      },
    });
    this.url = `https://${this.distribution.distributionDomainName}`;
  }
}

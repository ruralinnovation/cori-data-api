import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import {
  CloudFrontWebDistribution,
  SourceConfiguration,
  CloudFrontAllowedMethods,
  CloudFrontAllowedCachedMethods,
  OriginProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export interface CustomApiOriginConfig {
  domain: string;
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

  public buildOrigin(config: CustomApiOriginConfig): SourceConfiguration {
    return {
      customOriginSource: {
        domainName: config.domain,
        originPath: config.originPath,
        originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY
      },
      behaviors: [
        {
          isDefaultBehavior: config.default,
          pathPattern: config.behaviorPathPattern,
          forwardedValues: {
            queryString: true,
            headers: ['Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Origin', 'Authorization']
          },
          minTtl: Duration.seconds(0),
          defaultTtl: Duration.seconds(0),
          maxTtl: Duration.seconds(0),
          allowedMethods: CloudFrontAllowedMethods.ALL,
          cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS
        }
      ]
    };
  }

  constructor(scope: Construct, id: string, props: HostingProps) {
    super(scope, id);
    this.bucket = new Bucket(this, 'LogBucket', {
      bucketName: props.prefix + '-cloudfront-log-bucket'
    });

    this.distribution = new CloudFrontWebDistribution(this, 'Distribution', {
      comment: props.prefix,
      originConfigs: props.apiOriginConfigs.map(x => this.buildOrigin(x)),
      defaultRootObject: 'index.html',
      errorConfigurations: [
        {
          errorCode: 403,
          responseCode: 200,
          errorCachingMinTtl: 0
        },
        {
          errorCode: 404,
          responseCode: 200,
          errorCachingMinTtl: 0
        }
      ],
      loggingConfig: {
        bucket: this.bucket,
        prefix: 'cloudfront-logs/'
      }
    });
    this.url = `https://${this.distribution.distributionDomainName}`;
  }
}

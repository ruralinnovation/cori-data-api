import { Construct } from 'constructs';
import * as redis from 'aws-cdk-lib/aws-elasticache';

import { ISecurityGroup, IVpc } from 'aws-cdk-lib/aws-ec2';
import { RedisSubnetGroup } from './RedisSubnetGroup';
import { RedisSecurityGroup } from './RedisSecurityGroup';
import { CfnCacheCluster } from 'aws-cdk-lib/aws-elasticache';

interface RedisStackProps {
  vpc: IVpc;
  redisSecurityGroup: ISecurityGroup;
  prefix: string;
  private: boolean;
}

export class RedisCluster extends Construct {
  subnets: string[];
  redisCache: redis.CfnCacheCluster;
  constructor(scope: Construct, id: string, props: RedisStackProps) {
    super(scope, id);

    const redisSecurityGroup = new RedisSecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      securityGroupName: `${props.prefix}-redis-sg`,
    });

    const redisSubnetGroup = new RedisSubnetGroup(this, 'RedisSubnetGroup', {
      vpc: props.vpc,
      private: props.private,
    });

    // Create Redis Cluster
    this.redisCache = new CfnCacheCluster(this, 'RedisCluster', {
      autoMinorVersionUpgrade: true,
      cacheNodeType: 'cache.t2.small',
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      clusterName: props.prefix + 'redis-cluster',
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
    });

    // Define this redis cluster is depends on redis subnet group created first
    this.redisCache.addDependsOn(redisSubnetGroup);
  }
}

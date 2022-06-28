import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as redis from 'aws-cdk-lib/aws-elasticache';

import { ISecurityGroup, ISubnet, IVpc } from 'aws-cdk-lib/aws-ec2';

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

    // Get the vpc and redisSecurityGroup from vpc and security stack
    const { vpc, redisSecurityGroup } = props;

    // Get all private subnet ids
    if (props.private) {
      this.subnets = vpc.privateSubnets.map(subnet => {
        return subnet.subnetId;
      });
    } else {
      this.subnets = vpc.publicSubnets.map(subnet => {
        return subnet.subnetId;
      });
    }
    // Create redis subnet group from private subnet ids
    const redisSubnetGroup = new redis.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      subnetIds: this.subnets,
      description: 'Subnet group for redis'
    });

    // Create Redis Cluster
    this.redisCache = new redis.CfnCacheCluster(this, 'RedisCluster', {
      autoMinorVersionUpgrade: true,
      cacheNodeType: 'cache.t2.small',
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      clusterName: props.prefix + 'redis-cluster',
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId]
    });

    // Define this redis cluster is depends on redis subnet group created first
    this.redisCache.addDependsOn(redisSubnetGroup);
  }
}

import { CfnSubnetGroup } from 'aws-cdk-lib/aws-elasticache';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface RedisSubnetGroupProps {
  vpc: IVpc;
  private: boolean;
}
export class RedisSubnetGroup extends CfnSubnetGroup {
  constructor(scope: Construct, id: string, props: RedisSubnetGroupProps) {
    const subnets = props.private ? props.vpc.privateSubnets : props.vpc.publicSubnets;

    super(scope, id, {
      subnetIds: subnets.map(x => x.subnetId),
      description: 'Subnet group for redis'
    });
  }
}

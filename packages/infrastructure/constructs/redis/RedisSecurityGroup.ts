import { IVpc, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface RedisSecurityGroupProps {
  vpc: IVpc;
  securityGroupName: string;
}
export class RedisSecurityGroup extends SecurityGroup {
  constructor(scope: Construct, id: string, props: RedisSecurityGroupProps) {
    super(scope, id, {
      securityGroupName: props.securityGroupName,
      description: 'Security group for redis',
      vpc: props.vpc
    });

    this.addIngressRule(Peer.anyIpv4(), Port.tcp(6379), 'Redis from any where');
  }
}

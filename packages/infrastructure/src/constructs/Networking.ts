import { ISecurityGroup, IVpc, Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { DatabaseConfig } from '../stacks/ApiStack';

interface NetworkingProps {
  prefix: string;
  databaseConfig: DatabaseConfig;
}
export class Networking extends Construct {
  readonly vpc: IVpc;
  readonly lambdaSecurityGroup: SecurityGroup;
  readonly rdsSecurityGroup: ISecurityGroup;
  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    const { prefix, databaseConfig } = props;

    this.vpc = Vpc.fromLookup(this, 'CoriDbVpc', {
      vpcId: databaseConfig.vpcId,
    });

    this.lambdaSecurityGroup = new SecurityGroup(this, 'OutboundPythonLambdaSecurityGroup', {
      securityGroupName: `${prefix}-vpc-microservices-sg`,
      vpc: this.vpc,
      allowAllOutbound: false,
      description: 'Security group for RDS access',
    });

    this.rdsSecurityGroup = SecurityGroup.fromLookupById(
      this,
      'RDSSecurityGroup',
      databaseConfig.databaseSecurityGroupId
    );

    this.lambdaSecurityGroup.addEgressRule(this.rdsSecurityGroup, Port.tcp(5432), 'Allow Egress to PostgreSQL');
    this.rdsSecurityGroup.addIngressRule(this.lambdaSecurityGroup, Port.tcp(5432), 'Allow Ingress from Lambda');
  }
}

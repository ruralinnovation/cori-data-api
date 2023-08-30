import {
  ISecurityGroup,
  IVpc,
  Peer,
  Port,
  PrivateSubnet,
  SecurityGroup,
  SubnetSelection,
  Vpc
} from "aws-cdk-lib/aws-ec2";
import { Construct } from 'constructs';
import { DatabaseConfig } from '../stacks/ApiStack';

interface NetworkingProps {
  prefix: string;
  databaseConfig: DatabaseConfig;
}
export class Networking extends Construct {
  readonly vpc: IVpc;
  readonly vpcSubnets: SubnetSelection;
  readonly lambdaSecurityGroup: SecurityGroup;
  readonly rdsSecurityGroup: ISecurityGroup;
  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    const { prefix, databaseConfig } = props;

    this.vpc = Vpc.fromLookup(this, 'CoriDbVpc', {
      vpcId: databaseConfig.vpcId
    });

    const privateSubnet = new PrivateSubnet(this, 'CoriDataAPIPrivateSubnet', {
      availabilityZone: 'us-east-1c',
      cidrBlock: '172.30.10.0/24',
      vpcId: databaseConfig.vpcId,

      // the properties below are optional
      mapPublicIpOnLaunch: false,
    });

    privateSubnet.addDefaultNatRoute('nat-05efdd7ba7b190a56');

    // this.vpcSubnets = this.vpc.selectSubnets({
    //   subnetType: SubnetType.PRIVATE_WITH_NAT,
    // });

    this.vpcSubnets = this.vpc.selectSubnets({
      subnets: [ privateSubnet ]
    });

    console.log("VPC SUBNETS! ", this.vpc.selectSubnets().subnetIds);
    console.log("VPC PRIVATE SUBNETS? ", this.vpc.privateSubnets);
    console.log("Attempted to create private subnet: ", privateSubnet);

    this.lambdaSecurityGroup = new SecurityGroup(this, 'CORIDataAPILambdaSecurityGroup', {
      securityGroupName: `cda-${prefix}-lambda-rds-access`,
      vpc: this.vpc,
      allowAllOutbound: false,
      description: 'Security group for RDS access',
    });

    this.rdsSecurityGroup = SecurityGroup.fromLookupById(
      this,
      'RDSSecurityGroup',
      databaseConfig.databaseSecurityGroupId
    );

    this.lambdaSecurityGroup.addEgressRule(this.lambdaSecurityGroup, Port.allTraffic(), 'Allow Egress to Lambdas in same security group');
    this.lambdaSecurityGroup.addIngressRule(this.lambdaSecurityGroup, Port.allTraffic(), 'Allow Ingress from Lambdas in same security group');
    // this.lambdaSecurityGroup.addEgressRule(this.rdsSecurityGroup, Port.tcp(443), 'Allow Egress to HTTPS in same security group'); //<- DOES NOT WORK!
    this.lambdaSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow Egress to HTTPS');
    this.lambdaSecurityGroup.addEgressRule(this.rdsSecurityGroup, Port.tcp(5432), 'Allow Egress to PostgreSQL');
    this.rdsSecurityGroup.addIngressRule(this.lambdaSecurityGroup, Port.tcp(5432), 'Allow Ingress from Lambda');
    this.lambdaSecurityGroup.addEgressRule(this.rdsSecurityGroup, Port.tcp(6379), 'Allow Egress to Redis');
  }
}

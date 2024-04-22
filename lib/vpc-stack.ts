
import { Stack, StackProps } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcStack extends Stack {
  private readonly vpc: IVpc;
  private readonly securityGroup: ISecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'VpcForEc2Connection', {
      cidr: '10.0.0.0/16',
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: SubnetType.PUBLIC,
        },
      ]
    });

    this.securityGroup = new SecurityGroup(this, 'MySecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'AllowAllTraffic',
      description: 'Security group allowing all inbound and outbound traffic'
    });

    this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.allTraffic(), 'Allow all inbound traffic');

    this.securityGroup.addEgressRule(Peer.anyIpv4(), Port.allTraffic(), 'Allow all outbound traffic');
  }

  public getSecurityGroupId(): string {
    return this.securityGroup.securityGroupId;
  }

  public getSubnetId(): string {
    return this.vpc.publicSubnets[0].subnetId;
  }
}

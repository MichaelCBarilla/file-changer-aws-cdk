import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { CfnInstanceProfile, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { S3Stack } from './s3-stack';
import { VpcStack } from './vpc-stack';
import { DynamoDBStack } from './dynamodb-stack';


export class Ec2TriggerLambdaStack extends Stack {
  constructor(
    scope: Construct, 
    id: string,
    dynamoDbStack: DynamoDBStack, 
    s3Stack: S3Stack, 
    vpcStack: VpcStack,
    props?: StackProps
  ) {
    super(scope, id, props);

    const ec2Role = new Role(this, 'EC2Role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    ec2Role.addToPolicy(new PolicyStatement({
      actions: ['ec2-instance-connect:SendSSHPublicKey'],
      resources: ['*'],
    }));

    ec2Role.addToPolicy(new PolicyStatement({
      actions: ['ec2:TerminateInstances'],
      resources: ['*'],
    }));

    ec2Role.addToPolicy(new PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
      resources: [dynamoDbStack.getTableArn()],
    }));

    ec2Role.addToPolicy(new PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [`arn:aws:s3:::${s3Stack.getBucketName()}/*`],
    }));

    const instanceProfile= new CfnInstanceProfile(this, 'Ec2InstanceProfile', {
      roles: [ec2Role.roleName],
    });

    const lambda = new Function(this, 'ec2-trigger-handler', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda/ec2-trigger-handler/'),
      reservedConcurrentExecutions: 1,
      timeout: Duration.seconds(15),
      environment: {
        REGION: this.region,
        DYNAMO_DB_TABLE_NAME: dynamoDbStack.getTableName(),
        S3_BUCKET_NAME: s3Stack.getBucketName(),
        SECURITY_GROUP_ID: vpcStack.getSecurityGroupId(),
        SUBNET_ID: vpcStack.getSubnetId(),
        EC2_PROFILE_ARN: instanceProfile.attrArn,
      }
    });

    lambda.addToRolePolicy(new PolicyStatement({
      actions: [
        'dynamodb:GetRecords',
        'dynamodb:GetShardIterator',
        'dynamodb:DescribeStream',
        'dynamodb:ListStreams',
      ],
      resources: [dynamoDbStack.getTableArn()]
    }));

    lambda.addToRolePolicy(new PolicyStatement({
      actions: ['ec2:RunInstances', 'ec2:TerminateInstances', ],
      resources: ['*'],
    }));

    lambda.addToRolePolicy(new PolicyStatement({
      actions: ['iam:PassRole',],
      resources: [ec2Role.roleArn],
    }));

    lambda.addToRolePolicy(new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`arn:aws:s3:::${s3Stack.getBucketName()}/*`],
    }));

    lambda.addEventSource(new DynamoEventSource(dynamoDbStack.getTable(), {
      startingPosition: StartingPosition.LATEST
    }));

  }
}
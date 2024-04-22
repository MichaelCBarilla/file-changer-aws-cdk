import { Construct } from 'constructs';

import { Stack, StackProps } from 'aws-cdk-lib';

import { DynamoDBStack } from './dynamodb-stack';
import { VpcStack } from './vpc-stack';
import { S3Stack } from './s3-stack';
import { CognitoStack } from './cognito-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { InputProcessLambdaStack } from './input-process-lambda-stack';
import { Ec2TriggerLambdaStack } from './ec2-trigger-lambda-stack';


export class FileChangerAwsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const s3Stack = new S3Stack(this, 'FileChangerS3Stack');

    const dynamoDbStack = new DynamoDBStack(this, 'FileChangerDynamoDbStack');

    new CognitoStack(this, 'FileChangerCognitoStack', s3Stack);

    const inputProcessLambdaStack = new InputProcessLambdaStack(this, 'FileChangerInputProcessLambdaStack', dynamoDbStack);

    new ApiGatewayStack(this, 'FileChangerApiGatewayStack', inputProcessLambdaStack);

    const vpcStack = new VpcStack(this, 'FileChangerVpcStack');

    new Ec2TriggerLambdaStack(this, 'FileChangerEc2TriggerLambdaStack', dynamoDbStack, s3Stack, vpcStack);
  }
}

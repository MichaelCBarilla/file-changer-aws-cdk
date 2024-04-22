import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { DynamoDBStack } from './dynamodb-stack';


export class InputProcessLambdaStack extends Stack {
  private readonly lambda: Function;

  constructor(
    scope: Construct, 
    id: string,
    dynamoDbStack: DynamoDBStack, 
    props?: StackProps
  ) {
    super(scope, id, props);

    this.lambda = new Function(this, 'input-process-handler', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda/input-process-handler/'),
      reservedConcurrentExecutions: 1,
      timeout: Duration.seconds(15),
      environment: {
        REGION: this.region,
        DYNAMO_DB_TABLE_NAME: dynamoDbStack.getTableName(),
      }
    });

    this.lambda.addToRolePolicy(new PolicyStatement({
        actions: ['dynamodb:PutItem'],
        resources: [dynamoDbStack.getTableArn()]
      }));
  }

  public getLambda() {
    return this.lambda;
  }
}
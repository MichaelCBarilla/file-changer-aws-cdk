import { Stack, StackProps } from 'aws-cdk-lib';
import { InputProcessLambdaStack } from './input-process-lambda-stack';
import { Construct } from 'constructs';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

export class ApiGatewayStack extends Stack {
  constructor(scope: Construct, id: string, inputProcessLambdaStack: InputProcessLambdaStack, props?: StackProps) {
    super(scope, id, props);

    const lambdaIntegration = new LambdaIntegration(inputProcessLambdaStack.getLambda());

    const api = new RestApi(this, 'FileChangerApi', {
      restApiName: 'File Changer Api',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS
      },
      deployOptions: {
        stageName: 'dev'
      },
    });

    api.root.addMethod('POST', lambdaIntegration);
  }
}

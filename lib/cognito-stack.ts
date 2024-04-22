import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { S3Stack } from './s3-stack';
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
} from 'aws-cdk-lib/aws-cognito';
import {
  FederatedPrincipal,
  Policy,
  PolicyStatement,
  Role,
} from 'aws-cdk-lib/aws-iam';

export class CognitoStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    s3Stack: S3Stack,
    props?: StackProps
  ) {
    super(scope, id, props);

    const identityPool = new CfnIdentityPool(this, 'FileChangerDevIdPool', {
      identityPoolName: 'file-changer-dev-id-pool',
      allowUnauthenticatedIdentities: true,
    });

    const unauthenticatedRole = new Role(this, 'UnauthenticatedRole', {
      assumedBy: new FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    const s3WritePolicy = new Policy(this, 'S3WritePolicy', {
      statements: [
        new PolicyStatement({
          actions: ['s3:PutObject'],
          resources: [`arn:aws:s3:::${s3Stack.getBucketName()}/*`],
        }),
      ],
    });
    unauthenticatedRole.attachInlinePolicy(s3WritePolicy);

    new CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        unauthenticated: unauthenticatedRole.roleArn,
      },
    });
  }
}

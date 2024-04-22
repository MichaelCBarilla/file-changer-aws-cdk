import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
  CorsRule,
  HttpMethods,
} from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';

export class S3Stack extends Stack {
  private bucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.bucket = new Bucket(this, 'InputOutputBucket', {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const corsRule: CorsRule = {
      allowedMethods: [
        HttpMethods.GET,
        HttpMethods.PUT,
        HttpMethods.POST,
        HttpMethods.DELETE,
      ],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
      exposedHeaders: [],
    };
    this.bucket.addCorsRule(corsRule);

    new BucketDeployment(this, 'DeployScriptToS3', {
      sources: [Source.asset('scripts/')],
      destinationBucket: this.bucket,
      retainOnDelete: true,
    });
  }

  public getBucketName(): string {
    return this.bucket.bucketName;
  }
}






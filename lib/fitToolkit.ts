import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export default (scope: Construct): lambda.Function => {
  const blockPublicAccess: s3.BlockPublicAccess = {
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  };
  const fitFileS3Bucket = new s3.Bucket(scope, 'FitFileS3Bucket', {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });
  const s3PublicReadPolicy = new iam.PolicyStatement({
    actions: ['s3:GetObject'],
    resources: [`${fitFileS3Bucket.bucketArn}/*`],
    effect: iam.Effect.ALLOW,
    principals: [new iam.ArnPrincipal('*')],
  });
  fitFileS3Bucket.addToResourcePolicy(s3PublicReadPolicy);

  const fitToolkitFunction = new lambda.Function(scope, 'FitToolkitFunction', {
    runtime: lambda.Runtime.JAVA_11,
    handler: 'fit.toolkit.handler.WeightHandler::handleRequest',
    code: lambda.Code.fromAsset(
      'src/lambdas/java/fitToolkit/target/fit-toolkit-latest.jar'
    ),
    timeout: cdk.Duration.seconds(300),
    memorySize: 512,
    environment: {
      BUCKET_NAME: fitFileS3Bucket.bucketName,
    },
  });
  fitFileS3Bucket.grantReadWrite(fitToolkitFunction);

  const fitToolkitFunctionUrl = fitToolkitFunction.addFunctionUrl({
    authType: lambda.FunctionUrlAuthType.NONE,
  });
  new cdk.CfnOutput(scope, 'FitToolkitFunctionUrl', {
    value: fitToolkitFunctionUrl.url,
    description: 'Fit Toolkit Function URL',
  });

  return fitToolkitFunction;
};

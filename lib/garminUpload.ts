import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export default (scope: Construct) => {
  const garminUploadFunction = new NodejsFunction(
    scope,
    'GarminUploadNodejsFunction',
    {
      handler: 'handler',
      entry: 'src/lambdas/ts/garminUpload/index.ts',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        minify: true,
      },
      timeout: cdk.Duration.seconds(300),
      logRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    }
  );

  const garminUploadFunctionUrl = garminUploadFunction.addFunctionUrl({
    authType: lambda.FunctionUrlAuthType.NONE,
  });
  new cdk.CfnOutput(scope, 'GarminUploadFunctionUrl', {
    value: garminUploadFunctionUrl.url,
    description: 'Garmin Upload Function URL',
  });

  return garminUploadFunction;
};

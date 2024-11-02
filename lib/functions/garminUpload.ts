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
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        minify: true,
      },
      timeout: cdk.Duration.seconds(300),
    }
  );

  return garminUploadFunction;
};
